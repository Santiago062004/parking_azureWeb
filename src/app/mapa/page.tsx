/**
 * src/app/mapa/page.tsx
 *
 * Pantalla de Mapa del Campus EAFIT (Fase 4).
 *
 * Estructura:
 *   A. Header: "Mapa" + botón de notificaciones + volver
 *   B. Mapa Leaflet a pantalla completa (dynamic import — SSR:false)
 *   C. Leyenda flotante inferior con zonas y semáforo de accesos
 *   D. FAB de reporte (mismo de otras páginas)
 *   E. Modal de detección externa
 *   F. Toast de confirmación
 */

"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Bell, BellOff, Navigation } from "lucide-react";
import { FABReporte } from "@/components/FABReporte";
import { ToastConfirmacion } from "@/components/ToastConfirmacion";
import { ModalDeteccionExterna } from "@/components/ModalDeteccionExterna";
import { BadgeEstado } from "@/components/BadgeEstado";
import { useParking } from "@/hooks/useParking";
import { useReporte } from "@/hooks/useReporte";
import { useTracking } from "@/hooks/useTracking";
import { useNotificaciones } from "@/hooks/useNotificaciones";
import type { TipoVehiculo } from "@/types";

// Leaflet no soporta SSR → dynamic import obligatorio
const MapaCampus = dynamic(
    () => import("@/components/MapaCampus").then((m) => m.MapaCampus),
    { ssr: false, loading: () => <MapSkeleton /> }
);

function MapSkeleton() {
    return (
        <div className="w-full h-full bg-[#0F172A] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <Navigation className="w-8 h-8 text-[#C4D600] animate-bounce" />
                <p className="text-[#94A3B8] text-sm">Cargando mapa...</p>
            </div>
        </div>
    );
}

const COLOR_ESTADO: Record<string, string> = {
    disponible: "#C4D600",
    moderado: "#F97316",
    critico: "#EF4444",
    lleno: "#EF4444",
};

const COLOR_TRAFICO: Record<string, string> = {
    fluido: "#C4D600",
    moderado: "#F97316",
    congestionado: "#EF4444",
};

export default function PaginaMapa() {
    const [tipoVehiculo] = useState<TipoVehiculo>("carro");
    const { zonas, trafico, mejorRuta } = useParking(tipoVehiculo);
    const { estado: estadoReporte, mensaje, enviarReporte } = useReporte();
    const { permiso, solicitarPermiso, verificarCambioRuta, verificarCambioTrafico } =
        useNotificaciones();

    // Tracking solo cuando hay zonas cargadas
    const {
        posicion,
        mostrarModalExterno,
        cerrarModalExterno,
        disponible: geoDisponible,
    } = useTracking(zonas?.zonas ?? []);

    // Disparar verificaciones de notificación en cada polling
    const initRef = useRef(false);
    useEffect(() => {
        if (!initRef.current) { initRef.current = true; return; }
        if (mejorRuta) verificarCambioRuta(mejorRuta);
        if (trafico) verificarCambioTrafico(trafico);
    }, [mejorRuta, trafico, verificarCambioRuta, verificarCambioTrafico]);

    return (
        <div className="flex flex-col h-screen bg-[#0F172A] overflow-hidden">
            {/* ── A. Header ─────────────────────────────────────── */}
            <header className="z-20 bg-[#0F172A]/95 backdrop-blur-sm border-b border-[#334155]/50 px-4 py-3 flex items-center gap-3 shrink-0">
                <Link
                    href="/"
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#1E293B] border border-[#334155]"
                    aria-label="Volver"
                >
                    <ArrowLeft className="w-4 h-4 text-white" />
                </Link>
                <h1 className="text-white font-bold text-base flex-1">Mapa del campus</h1>

                {/* Botón de notificaciones */}
                <button
                    onClick={permiso === "granted" ? undefined : solicitarPermiso}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${permiso === "granted"
                            ? "bg-[#C4D600]/10 border-[#C4D600]/30 text-[#C4D600]"
                            : "bg-[#1E293B] border-[#334155] text-[#94A3B8]"
                        }`}
                >
                    {permiso === "granted" ? (
                        <><Bell className="w-3.5 h-3.5" /> Activas</>
                    ) : (
                        <><BellOff className="w-3.5 h-3.5" /> Notificar</>
                    )}
                </button>
            </header>

            {/* ── B. Mapa ───────────────────────────────────────── */}
            <div className="flex-1 relative">
                <MapaCampus
                    zonas={zonas?.zonas ?? []}
                    accesos={trafico?.accesos ?? []}
                    posicion={posicion}
                />

                {/* ── C. Leyenda flotante ── */}
                <div className="absolute bottom-4 left-3 right-3 z-10 pointer-events-none">
                    <div className="bg-[#1E293B]/90 backdrop-blur-sm border border-[#334155] rounded-2xl p-3">
                        {/* Accesos */}
                        {trafico && trafico.accesos.length > 0 && (
                            <div className="mb-2 pb-2 border-b border-[#334155]/50">
                                <p className="text-[#94A3B8] text-[10px] uppercase tracking-wider mb-1.5">Accesos</p>
                                <div className="flex gap-3">
                                    {trafico.accesos.map((a) => (
                                        <div key={a.punto} className="flex items-center gap-1.5">
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: COLOR_TRAFICO[a.estado] ?? "#94A3B8" }}
                                            />
                                            <span className="text-white text-xs">{a.via.split(" ")[0]}</span>
                                            <span className="text-[10px]" style={{ color: COLOR_TRAFICO[a.estado] }}>
                                                {a.currentSpeed} km/h
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Zonas */}
                        {zonas && (
                            <div>
                                <p className="text-[#94A3B8] text-[10px] uppercase tracking-wider mb-1.5">Zonas</p>
                                <div className="flex flex-wrap gap-2">
                                    {zonas.zonas.map((z) => (
                                        <div key={z.id} className="flex items-center gap-1">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full"
                                                style={{ backgroundColor: COLOR_ESTADO[z.estado] }}
                                            />
                                            <span className="text-[#94A3B8] text-[10px]">
                                                {z.nombre.split(" ")[0]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Geolocalización status */}
                        {geoDisponible && posicion && (
                            <div className="mt-2 pt-2 border-t border-[#334155]/50 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#C4D600] animate-pulse" />
                                <span className="text-[#94A3B8] text-[10px]">
                                    Ubicación activa · ±{Math.round(posicion.precision)}m
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── D. FAB ────────────────────────────────────────── */}
            <FABReporte
                zonas={zonas?.zonas.map((z) => ({ id: z.id, nombre: z.nombre })) ?? []}
                onReporte={enviarReporte}
                enviando={estadoReporte === "enviando"}
            />

            {/* ── E. Modal detección externa ─────────────────────── */}
            <ModalDeteccionExterna
                visible={mostrarModalExterno}
                zonas={zonas?.zonas ?? []}
                onReporte={enviarReporte}
                onCerrar={cerrarModalExterno}
            />

            {/* ── F. Toast ──────────────────────────────────────── */}
            <ToastConfirmacion
                visible={
                    estadoReporte === "ok" ||
                    estadoReporte === "error" ||
                    estadoReporte === "rate_limit"
                }
                mensaje={mensaje}
                tipo={estadoReporte === "ok" ? "ok" : estadoReporte === "rate_limit" ? "rate_limit" : "error"}
            />
        </div>
    );
}
