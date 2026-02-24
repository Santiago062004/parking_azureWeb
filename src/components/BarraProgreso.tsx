/**
 * src/components/BarraProgreso.tsx
 *
 * Barra de progreso animada de ocupación.
 * El color cambia según el estado: lima (disponible) → naranja → rojo.
 */

"use client";

import type { EstadoZona } from "@/types";

interface BarraProgresoProps {
    porcentaje: number;
    estado: EstadoZona;
    label?: string;
    showPercent?: boolean;
    height?: "thin" | "normal" | "thick";
}

const COLOR_POR_ESTADO: Record<EstadoZona, string> = {
    disponible: "#C4D600",
    moderado: "#F97316",
    critico: "#EF4444",
    lleno: "#EF4444",
};

const HEIGHT: Record<string, string> = {
    thin: "h-1",
    normal: "h-2",
    thick: "h-3",
};

export function BarraProgreso({
    porcentaje,
    estado,
    label,
    showPercent = false,
    height = "normal",
}: BarraProgresoProps) {
    const pct = Math.min(porcentaje, 100);
    const color = COLOR_POR_ESTADO[estado];

    return (
        <div className="w-full">
            {(label || showPercent) && (
                <div className="flex justify-between items-center mb-1">
                    {label && <span className="text-xs text-[#94A3B8]">{label}</span>}
                    {showPercent && (
                        <span className="text-xs font-medium" style={{ color }}>
                            {pct.toFixed(1)}%
                        </span>
                    )}
                </div>
            )}
            <div className={`w-full bg-[#334155] rounded-full overflow-hidden ${HEIGHT[height]}`}>
                <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
}
