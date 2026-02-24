/**
 * src/hooks/useTracking.ts
 *
 * Hook de geolocalización + geofencing para EAFIT Smart Parking.
 *
 * Funcionalidades:
 * 1. Seguimiento continuo con watchPosition (HTML5 Geolocation API).
 * 2. Detección externa: si el usuario está estático (<5 km/h por >1.5 min)
 *    en el perímetro del campus (radio ~300m desde el centro) → sugerir reporte.
 * 3. Detección interna: si el usuario entra/sale del radio de una zona,
 *    incrementa/decrementa la ocupación en +1/-1 en el servidor.
 * 4. Notifica cuando la zona recomendada cambia o un acceso se libera.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { haversine } from "@/lib/utils-client";
import type { Zona } from "@/types";

// Centro del campus EAFIT (punto de referencia para geofencing)
const CAMPUS_CENTER = { lat: 6.2, lng: -75.579 };
const CAMPUS_RADIO_M = 300; // metros

// Radio para detección interna de zona
const ZONA_RADIO_M = 80; // metros

// Umbral de velocidad para considerar "estático" (en m/s = 5 km/h)
const VELOCIDAD_ESTATICO_MS = 5 / 3.6;

// Tiempo mínimo estático para disparar modal (en ms)
const TIEMPO_ESTATICO_MS = 90_000; // 1.5 minutos

export interface PosicionUsuario {
    lat: number;
    lng: number;
    velocidad: number | null; // m/s
    precision: number;
    timestamp: number;
}

export interface TrackingState {
    posicion: PosicionUsuario | null;
    dentroDelCampus: boolean;
    zonaActual: Zona | null; // Zona donde está el usuario
    mostrarModalExterno: boolean; // Sugerir reporte desde afuera
    disponible: boolean; // true si la API está disponible
    error: string | null;
}

export function useTracking(zonas: Zona[]) {
    const [state, setState] = useState<TrackingState>({
        posicion: null,
        dentroDelCampus: false,
        zonaActual: null,
        mostrarModalExterno: false,
        disponible: false,
        error: null,
    });

    const estaticoDesdRef = useRef<number | null>(null);
    const zonaAnteriorRef = useRef<string | null>(null);
    const watchIdRef = useRef<number | null>(null);

    // Determinar qué zona contiene la posición (por radio)
    const detectarZona = useCallback(
        (lat: number, lng: number): Zona | null => {
            for (const zona of zonas) {
                const dist = haversine(lat, lng, zona.lat, zona.lng);
                if (dist <= ZONA_RADIO_M) return zona;
            }
            return null;
        },
        [zonas]
    );

    // Notificar al servidor el cambio de ocupación por geofencing
    const actualizarOcupacion = useCallback(
        async (zonaId: string, delta: number) => {
            try {
                const res = await fetch(`/api/zonas/${zonaId}`);
                const data = await res.json();
                const nuevaOcupacion = Math.max(0, data.carro.ocupacion + delta);
                await fetch(`/api/zonas/${zonaId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ocupacionCarro: nuevaOcupacion }),
                });
            } catch {
                // Falla silenciosa
            }
        },
        []
    );

    useEffect(() => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
            setState((s) => ({
                ...s,
                disponible: false,
                error: "Geolocalización no disponible en este dispositivo",
            }));
            return;
        }

        setState((s) => ({ ...s, disponible: true }));

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const velocidad = pos.coords.speed;
                const precision = pos.coords.accuracy;
                const timestamp = pos.timestamp;

                const nuevaPosicion: PosicionUsuario = { lat, lng, velocidad, precision, timestamp };

                // Distancia al centro del campus
                const distCampus = haversine(lat, lng, CAMPUS_CENTER.lat, CAMPUS_CENTER.lng);
                const dentroDelCampus = distCampus <= CAMPUS_RADIO_M;

                // Detección de zona actual
                const zonaActual = detectarZona(lat, lng);

                // Detección interna: entró o salió de zona
                const zonaActualId = zonaActual?.id ?? null;
                if (zonaActualId !== zonaAnteriorRef.current) {
                    if (zonaActualId) {
                        // Entró: +1
                        actualizarOcupacion(zonaActualId, +1);
                    } else if (zonaAnteriorRef.current) {
                        // Salió: -1
                        actualizarOcupacion(zonaAnteriorRef.current, -1);
                    }
                    zonaAnteriorRef.current = zonaActualId;
                }

                // Detección externa: estático en perímetro
                const esEstatico =
                    velocidad !== null ? velocidad < VELOCIDAD_ESTATICO_MS : false;

                if (dentroDelCampus && !zonaActual && esEstatico) {
                    if (!estaticoDesdRef.current) {
                        estaticoDesdRef.current = Date.now();
                    } else if (Date.now() - estaticoDesdRef.current >= TIEMPO_ESTATICO_MS) {
                        // El usuario lleva 1.5 min estático cerca del campus → mostrar modal
                        setState((s) => ({
                            ...s,
                            posicion: nuevaPosicion,
                            dentroDelCampus,
                            zonaActual,
                            mostrarModalExterno: true,
                        }));
                        estaticoDesdRef.current = null;
                        return;
                    }
                } else {
                    estaticoDesdRef.current = null;
                }

                setState((s) => ({
                    ...s,
                    posicion: nuevaPosicion,
                    dentroDelCampus,
                    zonaActual,
                    error: null,
                }));
            },
            (err) => {
                setState((s) => ({
                    ...s,
                    error:
                        err.code === 1
                            ? "Permiso de ubicación denegado"
                            : "No se pudo obtener la ubicación",
                }));
            },
            { enableHighAccuracy: true, maximumAge: 5000 }
        );

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [detectarZona, actualizarOcupacion, zonas]);

    const cerrarModalExterno = useCallback(() => {
        setState((s) => ({ ...s, mostrarModalExterno: false }));
    }, []);

    return { ...state, cerrarModalExterno };
}
