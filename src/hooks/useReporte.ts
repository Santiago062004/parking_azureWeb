/**
 * src/hooks/useReporte.ts
 *
 * Hook para crear reportes de usuario.
 * Maneja geolocalización, estado de carga y toast de confirmación.
 */

"use client";

import { useState, useCallback } from "react";
import type { TipoReporte } from "@/types";

// ID anónimo persistido en localStorage para rate limiting
function getUsuarioAnonId(): string {
    if (typeof window === "undefined") return "anon";
    const KEY = "eafit_parking_uid";
    let id = localStorage.getItem(KEY);
    if (!id) {
        id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        localStorage.setItem(KEY, id);
    }
    return id;
}

type EstadoReporte = "idle" | "enviando" | "ok" | "error" | "rate_limit";

interface ReporteHookReturn {
    estado: EstadoReporte;
    mensaje: string;
    enviarReporte: (zonaId: string, tipo: TipoReporte) => Promise<void>;
    resetear: () => void;
}

export function useReporte(): ReporteHookReturn {
    const [estado, setEstado] = useState<EstadoReporte>("idle");
    const [mensaje, setMensaje] = useState("");

    const enviarReporte = useCallback(
        async (zonaId: string, tipo: TipoReporte) => {
            setEstado("enviando");

            // Intentar obtener geolocalización (opcional, falla silenciosa)
            let lat: number | undefined;
            let lng: number | undefined;
            try {
                const pos = await new Promise<GeolocationPosition>((res, rej) =>
                    navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 })
                );
                lat = pos.coords.latitude;
                lng = pos.coords.longitude;
            } catch {
                // Sin geolocalización, continuar igual
            }

            try {
                const res = await fetch("/api/reportes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        zonaId,
                        tipo,
                        lat,
                        lng,
                        usuarioAnonId: getUsuarioAnonId(),
                    }),
                });

                if (res.status === 429) {
                    setEstado("rate_limit");
                    setMensaje("Máximo 3 reportes en 10 minutos");
                } else if (res.ok) {
                    setEstado("ok");
                    setMensaje("¡Gracias por reportar!");
                } else {
                    setEstado("error");
                    setMensaje("No se pudo enviar el reporte");
                }
            } catch {
                setEstado("error");
                setMensaje("Error de conexión");
            }

            // Auto-resetear después de 3 segundos
            setTimeout(() => setEstado("idle"), 3000);
        },
        []
    );

    const resetear = useCallback(() => {
        setEstado("idle");
        setMensaje("");
    }, []);

    return { estado, mensaje, enviarReporte, resetear };
}
