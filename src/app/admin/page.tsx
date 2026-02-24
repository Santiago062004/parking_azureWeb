/**
 * src/app/admin/page.tsx
 *
 * Dashboard Administrativo — Fase 3
 * Layout desktop (> 768px) de 2 columnas con h-screen.
 *
 * Columna izquierda (35%):
 *   - Header con estado general y botón volver
 *   - KPIs globales (ocupación + desglose por zona + accesos)
 *   - Feed de reportes en tiempo real
 *
 * Columna derecha (65%):
 *   - Header con botón "Forzar Refresh Tráfico"
 *   - Grid de tarjetas expandibles por zona (controles PATCH)
 *
 * En móvil (< 768px): muestra aviso de usar escritorio.
 */

"use client";

import Link from "next/link";
import { ArrowLeft, ParkingSquare, RefreshCw, Activity } from "lucide-react";
import { KPIsGlobales } from "@/components/admin/KPIsGlobales";
import { FeedReportes } from "@/components/admin/FeedReportes";
import { ZonaCardAdmin } from "@/components/admin/ZonaCardAdmin";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

function horaFormato(fecha: Date): string {
    return fecha.toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

export default function AdminDashboard() {
    const {
        zonas,
        trafico,
        feed,
        cargando,
        actualizando,
        ultimaActualizacion,
        refreshingTrafico,
        reportesNuevos,
        forzarRefreshTrafico,
        actualizarOcupacion,
    } = useAdminDashboard();

    // Mapa zonaId → nombre para el feed
    const zonaNames: Record<string, string> = {};
    if (zonas) {
        for (const z of zonas.zonas) {
            zonaNames[z.id] = z.nombre;
        }
    }

    // ── Aviso móvil ───────────────────────────────────
    return (
        <>
            {/* Aviso para pantallas pequeñas */}
            <div className="md:hidden min-h-screen bg-[#0F172A] flex items-center justify-center p-8">
                <div className="text-center">
                    <ParkingSquare className="w-12 h-12 text-[#004B87] mx-auto mb-4" />
                    <h1 className="text-white font-bold text-xl mb-2">Dashboard Admin</h1>
                    <p className="text-[#94A3B8] text-sm">
                        El dashboard admin está optimizado para pantalla de escritorio.
                        Abre esta URL en un computador para acceder.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-[#004B87] text-white rounded-xl text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver a la app
                    </Link>
                </div>
            </div>

            {/* ── Layout escritorio ──────────────────────────── */}
            <div className="hidden md:flex h-screen bg-[#0F172A] overflow-hidden">
                {/* ═══════════════════════════════════════════════
            COLUMNA IZQUIERDA (35%) — KPIs + Feed
        ═══════════════════════════════════════════════ */}
                <div className="w-[35%] min-w-[320px] max-w-[440px] flex flex-col border-r border-[#334155] h-screen">
                    {/* Header columna izquierda */}
                    <div className="shrink-0 border-b border-[#334155] px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#004B87] rounded-xl flex items-center justify-center">
                                <ParkingSquare className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h1 className="text-white font-bold text-sm leading-none">Admin Dashboard</h1>
                                <p className="text-[#94A3B8] text-xs">EAFIT Smart Parking</p>
                            </div>
                            <Link
                                href="/"
                                className="ml-auto flex items-center gap-1 px-2.5 py-1.5 bg-[#1E293B] border border-[#334155] rounded-xl text-xs text-[#94A3B8] hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                App
                            </Link>
                        </div>

                        {/* Estado de actualización */}
                        <div className="flex items-center gap-1.5 mt-3">
                            {actualizando
                                ? <RefreshCw className="w-3 h-3 text-[#C4D600] animate-spin" />
                                : <Activity className="w-3 h-3 text-[#C4D600]" />
                            }
                            <span className="text-[#94A3B8] text-xs">
                                {ultimaActualizacion
                                    ? `Actualizado ${horaFormato(ultimaActualizacion)}`
                                    : "Cargando..."
                                }
                            </span>
                            <span className="ml-auto text-[#94A3B8] text-xs">
                                Polling: 15s
                            </span>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="shrink-0 p-4 border-b border-[#334155]">
                        {cargando || !zonas || !trafico ? (
                            <div className="space-y-3 animate-pulse">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-20 bg-[#1E293B] rounded-xl" />
                                ))}
                            </div>
                        ) : (
                            <KPIsGlobales
                                zonas={zonas}
                                trafico={trafico}
                                onRefreshTrafico={forzarRefreshTrafico}
                                refreshingTrafico={refreshingTrafico}
                            />
                        )}
                    </div>

                    {/* Feed de reportes — scroll independiente */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="shrink-0 px-4 py-3 border-b border-[#334155]">
                            <div className="flex items-center justify-between">
                                <p className="text-[#94A3B8] text-xs font-medium uppercase tracking-wider">
                                    Feed de reportes
                                </p>
                                <span className="text-[#94A3B8] text-xs">
                                    {feed.length} reportes
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-0">
                            <FeedReportes
                                reportes={feed}
                                reportesNuevos={reportesNuevos}
                                zonaNames={zonaNames}
                            />
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════
            COLUMNA DERECHA (65%) — Zonas Admin
        ═══════════════════════════════════════════════ */}
                <div className="flex-1 flex flex-col h-screen overflow-hidden">
                    {/* Header columna derecha */}
                    <div className="shrink-0 border-b border-[#334155] px-6 py-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-white font-bold text-sm">Gestión de Zonas</h2>
                            <p className="text-[#94A3B8] text-xs">
                                {zonas ? `${zonas.zonas.length} zonas · ${zonas.totalCeldas} celdas totales` : "Cargando..."}
                            </p>
                        </div>
                        <button
                            onClick={forzarRefreshTrafico}
                            disabled={refreshingTrafico}
                            className="flex items-center gap-2 px-3 py-2 bg-[#004B87] hover:bg-[#0057a0] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshingTrafico ? "animate-spin" : ""}`} />
                            Forzar refresh tráfico
                        </button>
                    </div>

                    {/* Grid de zonas — scroll independiente */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {cargando || !zonas ? (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="h-40 bg-[#1E293B] rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                {zonas.zonas.map((zona) => (
                                    <ZonaCardAdmin
                                        key={zona.id}
                                        zona={zona}
                                        onActualizar={actualizarOcupacion}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
