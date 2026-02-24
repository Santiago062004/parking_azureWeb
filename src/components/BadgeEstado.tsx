/**
 * src/components/BadgeEstado.tsx
 *
 * Badge de color que refleja el estado de ocupación de una zona.
 * Usado en las tarjetas de zona y en el header de detalle.
 */

"use client";

import type { EstadoZona } from "@/types";

interface BadgeEstadoProps {
    estado: EstadoZona;
    size?: "sm" | "md";
}

const CONFIG: Record<EstadoZona, { label: string; className: string }> = {
    disponible: {
        label: "Disponible",
        className: "bg-[#C4D600]/20 text-[#C4D600] border border-[#C4D600]/30",
    },
    moderado: {
        label: "Moderado",
        className: "bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/30",
    },
    critico: {
        label: "Crítico",
        className: "bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30",
    },
    lleno: {
        label: "Lleno",
        className: "bg-[#EF4444]/30 text-[#EF4444] border border-[#EF4444]/40 animate-pulse",
    },
};

export function BadgeEstado({ estado, size = "sm" }: BadgeEstadoProps) {
    const { label, className } = CONFIG[estado];
    const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

    return (
        <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${className}`}>
            {estado === "lleno" && <span className="mr-1 w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-ping inline-block" />}
            {label}
        </span>
    );
}
