/**
 * src/hooks/useParking.ts
 *
 * Hook central que maneja todos los datos de la app: zonas, tráfico y mejor ruta.
 * Implementa polling cada 30 segundos para mantener los datos actualizados.
 * Un único punto de fetching para evitar race conditions.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type {
    ZonasResponse,
    TraficoResponse,
    MejorRutaResponse,
    TipoVehiculo,
} from "@/types";

interface ParkingState {
    zonas: ZonasResponse | null;
    trafico: TraficoResponse | null;
    mejorRuta: MejorRutaResponse | null;
    cargando: boolean;
    actualizando: boolean; // true durante polls silenciosos
    error: string | null;
    ultimaActualizacion: Date | null;
}

const POLLING_MS = 30_000; // 30 segundos

export function useParking(tipoVehiculo: TipoVehiculo) {
    const [state, setState] = useState<ParkingState>({
        zonas: null,
        trafico: null,
        mejorRuta: null,
        cargando: true,
        actualizando: false,
        error: null,
        ultimaActualizacion: null,
    });

    const fetchTodos = useCallback(
        async (silencioso = false) => {
            setState((prev) => ({
                ...prev,
                cargando: !silencioso && !prev.zonas,
                actualizando: silencioso,
                error: null,
            }));

            try {
                const [zonasRes, traficoRes, rutaRes] = await Promise.all([
                    fetch("/api/zonas"),
                    fetch("/api/trafico"),
                    fetch(`/api/mejor-ruta?tipo=${tipoVehiculo}`),
                ]);

                const [zonas, trafico, mejorRuta] = await Promise.all([
                    zonasRes.json(),
                    traficoRes.json(),
                    rutaRes.json(),
                ]);

                setState({
                    zonas,
                    trafico,
                    mejorRuta: mejorRuta.error ? null : mejorRuta,
                    cargando: false,
                    actualizando: false,
                    error: null,
                    ultimaActualizacion: new Date(),
                });
            } catch {
                setState((prev) => ({
                    ...prev,
                    cargando: false,
                    actualizando: false,
                    error: "Error de conexión. Reintentando...",
                }));
            }
        },
        [tipoVehiculo]
    );

    // Carga inicial y cada vez que cambia tipo de vehículo
    useEffect(() => {
        fetchTodos(false);
    }, [fetchTodos]);

    // Polling cada 30s
    useEffect(() => {
        const intervalo = setInterval(() => fetchTodos(true), POLLING_MS);
        return () => clearInterval(intervalo);
    }, [fetchTodos]);

    return { ...state, refetch: () => fetchTodos(false) };
}
