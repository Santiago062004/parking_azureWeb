/**
 * src/components/HeroMejorRuta.tsx
 *
 * Tarjeta Hero "MEJOR RUTA AHORA" — la pieza central de la app.
 * Muestra la zona recomendada + acceso + razón con animación de entrada.
 * Fondo gradiente azul EAFIT institucional.
 */

"use client";

import { Navigation, Zap, ZapOff, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import type { MejorRutaResponse } from "@/types";

interface HeroMejorRutaProps {
    data: MejorRutaResponse | null;
    cargando: boolean;
}

const BORDE_POR_ESTADO: Record<string, string> = {
    disponible: "border-[#C4D600]",
    moderado: "border-[#F97316]",
    critico: "border-[#EF4444]",
    lleno: "border-[#EF4444]",
};

export function HeroMejorRuta({ data, cargando }: HeroMejorRutaProps) {
    if (cargando) {
        return (
            <div className="relative overflow-hidden rounded-2xl border border-[#004B87]/40 bg-gradient-to-br from-[#004B87] to-[#0F172A] p-5 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
                <div className="h-8 bg-white/10 rounded w-2/3 mb-2" />
                <div className="h-4 bg-white/10 rounded w-full" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="relative overflow-hidden rounded-2xl border border-[#334155] bg-[#1E293B] p-5">
                <div className="flex items-center gap-2 text-[#94A3B8]">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">Sin zonas disponibles para este tipo de vehículo</span>
                </div>
            </div>
        );
    }

    const rec = data.recomendacion;
    const bordeColor = BORDE_POR_ESTADO[rec.zona.estado] ?? "border-[#C4D600]";
    const traficoBien = rec.acceso && !rec.acceso.congestionado;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`relative overflow-hidden rounded-2xl border-2 ${bordeColor} bg-gradient-to-br from-[#004B87] via-[#003366] to-[#0F172A] p-5`}
        >
            {/* Etiqueta superior */}
            <div className="flex items-center gap-2 mb-3">
                <Navigation className="w-4 h-4 text-[#C4D600]" />
                <span className="text-[#C4D600] text-xs font-bold tracking-widest uppercase">
                    Mejor ruta ahora
                </span>
            </div>

            {/* Zona recomendada */}
            <h2 className="text-white text-2xl font-bold leading-tight">
                {rec.zona.nombre}
            </h2>
            <p className="text-[#C4D600] text-lg font-semibold mt-0.5">
                {rec.zona.disponibles} cupos disponibles
            </p>

            {/* Acceso */}
            {rec.acceso && (
                <div className="flex items-center gap-2 mt-3">
                    {traficoBien
                        ? <Zap className="w-4 h-4 text-[#C4D600] shrink-0" />
                        : <ZapOff className="w-4 h-4 text-[#F97316] shrink-0" />
                    }
                    <span className="text-white/80 text-sm">
                        Ingresa por{" "}
                        <span className="font-semibold text-white">{rec.acceso.via}</span>
                        {" — "}
                        <span className={traficoBien ? "text-[#C4D600]" : "text-[#F97316]"}>
                            Tráfico {rec.acceso.estado}
                        </span>
                    </span>
                </div>
            )}

            {/* Razón / descripción */}
            <p className="text-white/60 text-xs mt-3 leading-relaxed">{rec.razon}</p>

            {/* Indicador de confianza (score) */}
            <div className="absolute top-4 right-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                        {Math.round(rec.score * 100)}
                    </span>
                </div>
            </div>

            {/* Alternativa */}
            {rec.alternativa && (
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-white/50 text-xs">Alternativa:</span>
                    <span className="text-white/70 text-xs font-medium">
                        {rec.alternativa.zona} — {rec.alternativa.disponibles} cupos
                    </span>
                </div>
            )}
        </motion.div>
    );
}
