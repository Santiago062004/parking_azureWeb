/**
 * src/components/admin/KPIsGlobales.tsx
 *
 * Panel izquierdo superior: métricas globales del parqueadero.
 * - Ocupación total (conteo + barra de progreso)
 * - Desglose mini-barra por zona
 * - Semáforos de acceso Vegas / Cra49
 */

"use client";

import { TrendingUp, Car, Bike, TrafficCone, RefreshCw } from "lucide-react";
import type { ZonasResponse, TraficoResponse } from "@/types";

interface KPIsGlobalesProps {
    zonas: ZonasResponse;
    trafico: TraficoResponse;
    onRefreshTrafico: () => void;
    refreshingTrafico: boolean;
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

export function KPIsGlobales({
    zonas,
    trafico,
    onRefreshTrafico,
    refreshingTrafico,
}: KPIsGlobalesProps) {
    const libres = zonas.totalCeldas - zonas.totalOcupadas;

    return (
        <div className="space-y-4">
            {/* ── Ocupación global ─────────────────────────── */}
            <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#94A3B8]" />
                        <span className="text-[#94A3B8] text-xs font-medium uppercase tracking-wider">
                            Ocupación Global
                        </span>
                    </div>
                    <span className="text-white font-bold text-lg">{zonas.porcentajeGlobal}%</span>
                </div>

                {/* Barra global */}
                <div className="h-2 bg-[#334155] rounded-full overflow-hidden mb-3">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${zonas.porcentajeGlobal}%`,
                            backgroundColor: zonas.porcentajeGlobal >= 90 ? "#EF4444"
                                : zonas.porcentajeGlobal >= 70 ? "#F97316" : "#C4D600",
                        }}
                    />
                </div>

                {/* Contadores carro / moto */}
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-[#94A3B8]" />
                        <span className="text-white text-sm font-semibold">
                            {zonas.zonas.reduce((s, z) => s + z.carro.disponibles, 0)}
                        </span>
                        <span className="text-[#94A3B8] text-xs">carros libres</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Bike className="w-3.5 h-3.5 text-[#94A3B8]" />
                        <span className="text-white text-sm font-semibold">
                            {zonas.zonas.reduce((s, z) => s + z.moto.disponibles, 0)}
                        </span>
                        <span className="text-[#94A3B8] text-xs">motos libres</span>
                    </div>
                </div>
            </div>

            {/* ── Desglose por zona ────────────────────────── */}
            <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
                <p className="text-[#94A3B8] text-xs font-medium uppercase tracking-wider mb-3">
                    Por zona
                </p>
                <div className="space-y-3">
                    {zonas.zonas.map((z) => {
                        const color = COLOR_ESTADO[z.estado] ?? "#94A3B8";
                        return (
                            <div key={z.id}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-white text-xs truncate max-w-[60%]">{z.nombre}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs" style={{ color }}>
                                            {z.carro.disponibles} lib.
                                        </span>
                                        <span className="text-[#94A3B8] text-xs">
                                            {z.carro.porcentaje.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="h-1.5 bg-[#334155] rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${z.carro.porcentaje}%`, backgroundColor: color }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Accesos (semáforos) ──────────────────────── */}
            <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <TrafficCone className="w-4 h-4 text-[#94A3B8]" />
                        <p className="text-[#94A3B8] text-xs font-medium uppercase tracking-wider">
                            Accesos
                        </p>
                    </div>
                    <button
                        onClick={onRefreshTrafico}
                        disabled={refreshingTrafico}
                        className="flex items-center gap-1 px-2 py-1 bg-[#0F172A] border border-[#334155] rounded-lg text-xs text-[#94A3B8] hover:text-white transition-colors disabled:opacity-40"
                        title="Forzar refresh de tráfico"
                    >
                        <RefreshCw className={`w-3 h-3 ${refreshingTrafico ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>
                <div className="space-y-2">
                    {trafico.accesos.map((a) => {
                        const color = COLOR_TRAFICO[a.estado] ?? "#94A3B8";
                        return (
                            <div key={a.punto} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: color }}
                                    />
                                    <span className="text-white text-sm">{a.via}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-medium capitalize" style={{ color }}>
                                        {a.estado}
                                    </span>
                                    <span className="text-[#94A3B8] text-xs ml-2">{a.currentSpeed} km/h</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
