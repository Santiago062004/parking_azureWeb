/**
 * src/hooks/useNotificaciones.ts
 *
 * Hook para el Notification API del navegador.
 * Pide permiso al usuario y expone función para enviar notificaciones.
 *
 * Notifica cuando:
 * - La zona recomendada cambia
 * - Un acceso pasa de congestionado a fluido
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { MejorRutaResponse, TraficoResponse } from "@/types";

export function useNotificaciones() {
    const [permiso, setPermiso] = useState<NotificationPermission>("default");
    const zonaPrevRef = useRef<string>("");
    const traficoEstadoPrevRef = useRef<Record<string, string>>({});

    useEffect(() => {
        if (typeof Notification !== "undefined") {
            setPermiso(Notification.permission);
        }
    }, []);

    const solicitarPermiso = useCallback(async () => {
        if (typeof Notification === "undefined") return;
        const resultado = await Notification.requestPermission();
        setPermiso(resultado);
    }, []);

    const notificar = useCallback(
        (titulo: string, cuerpo: string) => {
            if (permiso !== "granted") return;
            new Notification(titulo, {
                body: cuerpo,
                icon: "/favicon.ico",
                badge: "/favicon.ico",
            });
        },
        [permiso]
    );

    // Compara la mejor ruta anterior con la nueva y notifica si cambia
    const verificarCambioRuta = useCallback(
        (nuevaRuta: MejorRutaResponse | null) => {
            if (!nuevaRuta) return;
            const zonaActual = nuevaRuta.recomendacion.zona.nombre;
            if (zonaPrevRef.current && zonaActual !== zonaPrevRef.current) {
                notificar(
                    "🔄 Ruta actualizada — EAFIT Smart Parking",
                    `La mejor zona cambió a ${zonaActual} (${nuevaRuta.recomendacion.zona.disponibles} cupos)`
                );
            }
            zonaPrevRef.current = zonaActual;
        },
        [notificar]
    );

    // Detecta cuando un acceso pasa de congestionado a fluido
    const verificarCambioTrafico = useCallback(
        (nuevoTrafico: TraficoResponse | null) => {
            if (!nuevoTrafico) return;
            for (const acceso of nuevoTrafico.accesos) {
                const prevEstado = traficoEstadoPrevRef.current[acceso.punto];
                if (prevEstado === "congestionado" && acceso.estado === "fluido") {
                    notificar(
                        "🚦 Vía despejada — EAFIT Smart Parking",
                        `${acceso.via} ahora está fluida (${acceso.currentSpeed} km/h)`
                    );
                }
                traficoEstadoPrevRef.current[acceso.punto] = acceso.estado;
            }
        },
        [notificar]
    );

    return { permiso, solicitarPermiso, verificarCambioRuta, verificarCambioTrafico };
}
