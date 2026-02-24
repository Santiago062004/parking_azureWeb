/**
 * src/hooks/useAdminDashboard.ts
 *
 * Hook central para el dashboard admin.
 * Combina polling de zonas, tráfico, feed de reportes y
 * expone métodos para PATCH ocupación y forzar refresh de tráfico.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ZonasResponse, TraficoResponse } from "@/types";

interface Reporte {
    id: string;
    tipo: string;
    zonaId: string;
    zona?: { nombre: string };
    usuarioAnonId: string;
    lat?: number;
    lng?: number;
    confianza: number;
    expiraEn: string;
    createdAt: string;
}

interface FeedResponse {
    reportes: Reporte[];
}

interface AdminState {
    zonas: ZonasResponse | null;
    trafico: TraficoResponse | null;
    feed: Reporte[];
    cargando: boolean;
    actualizando: boolean;
    ultimaActualizacion: Date | null;
    refreshingTrafico: boolean;
    error: string | null;
}

const POLLING_MS = 15_000; // 15s — más frecuente en admin

export function useAdminDashboard() {
    const [state, setState] = useState<AdminState>({
        zonas: null,
        trafico: null,
        feed: [],
        cargando: true,
        actualizando: false,
        ultimaActualizacion: null,
        refreshingTrafico: false,
        error: null,
    });

    const feedIdsRef = useRef<Set<string>>(new Set()); // IDs ya conocidos
    const [reportesNuevos, setReportesNuevos] = useState<Set<string>>(new Set());

    const fetchTodos = useCallback(async (silencioso = false) => {
        setState((p) => ({
            ...p,
            cargando: !silencioso && !p.zonas,
            actualizando: silencioso,
        }));

        try {
            const [zonasRes, traficoRes, feedRes] = await Promise.all([
                fetch("/api/zonas"),
                fetch("/api/trafico"),
                fetch("/api/reportes/feed"),
            ]);

            const [zonas, trafico, feedData]: [ZonasResponse, TraficoResponse, FeedResponse] =
                await Promise.all([
                    zonasRes.json(),
                    traficoRes.json(),
                    feedRes.json(),
                ]);

            // Detectar reportes nuevos para animación
            const idsNuevos: Set<string> = new Set();
            for (const r of feedData.reportes) {
                if (!feedIdsRef.current.has(r.id)) {
                    idsNuevos.add(r.id);
                    feedIdsRef.current.add(r.id);
                }
            }
            if (idsNuevos.size > 0) {
                setReportesNuevos(idsNuevos);
                setTimeout(() => setReportesNuevos(new Set()), 3000);
            }

            setState((p) => ({
                ...p,
                zonas,
                trafico,
                feed: feedData.reportes,
                cargando: false,
                actualizando: false,
                ultimaActualizacion: new Date(),
                error: null,
            }));
        } catch {
            setState((p) => ({
                ...p,
                cargando: false,
                actualizando: false,
                error: "Error de conexión",
            }));
        }
    }, []);

    // Carga inicial
    useEffect(() => { fetchTodos(false); }, [fetchTodos]);

    // Polling cada 15s
    useEffect(() => {
        const id = setInterval(() => fetchTodos(true), POLLING_MS);
        return () => clearInterval(id);
    }, [fetchTodos]);

    // Forzar refresh de tráfico
    const forzarRefreshTrafico = useCallback(async () => {
        setState((p) => ({ ...p, refreshingTrafico: true }));
        try {
            await fetch("/api/trafico/refresh", { method: "POST" });
            await fetchTodos(true);
        } finally {
            setState((p) => ({ ...p, refreshingTrafico: false }));
        }
    }, [fetchTodos]);

    // Actualizar ocupación de una zona
    const actualizarOcupacion = useCallback(
        async (
            zonaId: string,
            ocupacionCarro: number,
            ocupacionMoto: number
        ) => {
            await fetch(`/api/zonas/${zonaId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ocupacionCarro, ocupacionMoto }),
            });
            await fetchTodos(true);
        },
        [fetchTodos]
    );

    return {
        ...state,
        reportesNuevos,
        refetch: () => fetchTodos(false),
        forzarRefreshTrafico,
        actualizarOcupacion,
    };
}
