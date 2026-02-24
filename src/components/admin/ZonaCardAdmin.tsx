/**
 * src/components/admin/ZonaCardAdmin.tsx
 *
 * Tarjeta expandida de zona para el dashboard admin.
 * Columna derecha del layout.
 *
 * Muestra:
 * - Nombre, estado y ubicación
 * - Barra de ocupación carro + moto
 * - Reportes activos de esa zona
 * - Controles: +/- ocupación carro, +/- ocupación moto
 */

"use client";

import { useState } from "react";
import { Car, Bike, ChevronDown, ChevronUp, Plus, Minus, Loader2 } from "lucide-react";
import { BadgeEstado } from "@/components/BadgeEstado";
import { BarraProgreso } from "@/components/BarraProgreso";
import type { Zona } from "@/types";

interface ZonaCardAdminProps {
    zona: Zona;
    onActualizar: (
        zonaId: string,
        ocupacionCarro: number,
        ocupacionMoto: number
    ) => Promise<void>;
}

const LABEL_REPORTE: Record<string, string> = {
    fila_moderada: "🚗 Fila moderada",
    congestion_severa: "🚨 Congestión",
    lleno: "🅿️ Lleno",
    hay_cupos: "✅ Hay cupos",
    accidente: "⚠️ Accidente",
};

export function ZonaCardAdmin({ zona, onActualizar }: ZonaCardAdminProps) {
    const [cargando, setCargando] = useState(false);
    const [expandido, setExpandido] = useState(false);

    const ajustar = async (
        deltaCarro: number,
        deltaMoto: number
    ) => {
        const nuevaCarro = Math.max(
            0,
            Math.min(zona.carro.capacidad, zona.carro.ocupacion + deltaCarro)
        );
        const nuevaMoto = Math.max(
            0,
            Math.min(zona.moto.capacidad, zona.moto.ocupacion + deltaMoto)
        );

        setCargando(true);
        try {
            await onActualizar(zona.id, nuevaCarro, nuevaMoto);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
            {/* Header de la tarjeta */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer select-none"
                onClick={() => setExpandido(!expandido)}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-white font-semibold text-sm">{zona.nombre}</h3>
                            <BadgeEstado estado={zona.estado} />
                        </div>
                        <p className="text-[#94A3B8] text-xs mt-0.5">{zona.ubicacion}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                    {/* Cupos rápidos */}
                    <div className="flex gap-3 text-right">
                        <div>
                            <p className="text-white font-bold text-sm">{zona.carro.disponibles}</p>
                            <p className="text-[#94A3B8] text-[10px]">carros</p>
                        </div>
                        {zona.moto.capacidad > 0 && (
                            <div>
                                <p className="text-white font-bold text-sm">{zona.moto.disponibles}</p>
                                <p className="text-[#94A3B8] text-[10px]">motos</p>
                            </div>
                        )}
                    </div>
                    {expandido
                        ? <ChevronUp className="w-4 h-4 text-[#94A3B8]" />
                        : <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
                    }
                </div>
            </div>

            {/* Barras de ocupación (siempre visibles) */}
            <div className="px-4 pb-3 space-y-2">
                <BarraProgreso
                    porcentaje={zona.carro.porcentaje}
                    estado={zona.estado}
                    label={`Carros ${zona.carro.ocupacion}/${zona.carro.capacidad}`}
                    showPercent
                    height="normal"
                />
                {zona.moto.capacidad > 0 && (
                    <BarraProgreso
                        porcentaje={zona.moto.porcentaje}
                        estado={zona.estado}
                        label={`Motos ${zona.moto.ocupacion}/${zona.moto.capacidad}`}
                        showPercent
                        height="thin"
                    />
                )}
            </div>

            {/* Panel expandible */}
            {expandido && (
                <div className="border-t border-[#334155] p-4 space-y-4">
                    {/* Controles de ocupación */}
                    <div>
                        <p className="text-[#94A3B8] text-xs font-medium uppercase tracking-wider mb-3">
                            Ajustar ocupación
                        </p>
                        <div className="flex gap-3">
                            {/* Carros */}
                            <div className="flex-1">
                                <p className="text-white text-xs mb-2 flex items-center gap-1">
                                    <Car className="w-3.5 h-3.5 text-[#94A3B8]" /> Carros
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => ajustar(-1, 0)}
                                        disabled={cargando || zona.carro.ocupacion <= 0}
                                        className="w-8 h-8 flex items-center justify-center bg-[#0F172A] border border-[#334155] rounded-lg text-white hover:border-[#94A3B8] disabled:opacity-40 transition-colors"
                                    >
                                        <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="text-white font-bold text-lg min-w-[2rem] text-center">
                                        {zona.carro.ocupacion}
                                    </span>
                                    <button
                                        onClick={() => ajustar(+1, 0)}
                                        disabled={cargando || zona.carro.disponibles <= 0}
                                        className="w-8 h-8 flex items-center justify-center bg-[#0F172A] border border-[#334155] rounded-lg text-white hover:border-[#94A3B8] disabled:opacity-40 transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Motos */}
                            {zona.moto.capacidad > 0 && (
                                <div className="flex-1">
                                    <p className="text-white text-xs mb-2 flex items-center gap-1">
                                        <Bike className="w-3.5 h-3.5 text-[#94A3B8]" /> Motos
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => ajustar(0, -1)}
                                            disabled={cargando || zona.moto.ocupacion <= 0}
                                            className="w-8 h-8 flex items-center justify-center bg-[#0F172A] border border-[#334155] rounded-lg text-white hover:border-[#94A3B8] disabled:opacity-40 transition-colors"
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="text-white font-bold text-lg min-w-[2rem] text-center">
                                            {zona.moto.ocupacion}
                                        </span>
                                        <button
                                            onClick={() => ajustar(0, +1)}
                                            disabled={cargando || zona.moto.disponibles <= 0}
                                            className="w-8 h-8 flex items-center justify-center bg-[#0F172A] border border-[#334155] rounded-lg text-white hover:border-[#94A3B8] disabled:opacity-40 transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {cargando && (
                                <Loader2 className="w-4 h-4 text-[#C4D600] animate-spin self-center" />
                            )}
                        </div>
                    </div>

                    {/* Reportes activos de esta zona */}
                    {zona.reportes.length > 0 && (
                        <div>
                            <p className="text-[#94A3B8] text-xs font-medium uppercase tracking-wider mb-2">
                                Reportes activos ({zona.reportesActivos})
                            </p>
                            <div className="space-y-1.5">
                                {zona.reportes.slice(0, 5).map((r) => {
                                    const mins = Math.round(
                                        (Date.now() - new Date(r.createdAt).getTime()) / 60000
                                    );
                                    return (
                                        <div
                                            key={r.id}
                                            className="flex items-center justify-between bg-[#0F172A] rounded-lg px-3 py-2"
                                        >
                                            <span className="text-sm text-white">
                                                {LABEL_REPORTE[r.tipo] ?? r.tipo}
                                            </span>
                                            <span className="text-[#94A3B8] text-xs">
                                                hace {mins < 1 ? "<1" : mins} min
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
