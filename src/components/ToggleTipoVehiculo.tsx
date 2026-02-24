/**
 * src/components/ToggleTipoVehiculo.tsx
 *
 * Toggle Carro / Moto que cambia el filtro global de la app.
 * Persiste la selección en localStorage.
 */

"use client";

import { Car, Bike } from "lucide-react";
import type { TipoVehiculo } from "@/types";

interface ToggleTipoVehiculoProps {
    value: TipoVehiculo;
    onChange: (tipo: TipoVehiculo) => void;
}

export function ToggleTipoVehiculo({ value, onChange }: ToggleTipoVehiculoProps) {
    return (
        <div className="flex bg-[#0F172A] border border-[#334155] rounded-xl p-1 gap-1">
            <button
                onClick={() => onChange("carro")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${value === "carro"
                        ? "bg-[#004B87] text-white shadow-md"
                        : "text-[#94A3B8] hover:text-white"
                    }`}
            >
                <Car className="w-4 h-4" />
                Carro
            </button>
            <button
                onClick={() => onChange("moto")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${value === "moto"
                        ? "bg-[#004B87] text-white shadow-md"
                        : "text-[#94A3B8] hover:text-white"
                    }`}
            >
                <Bike className="w-4 h-4" />
                Moto
            </button>
        </div>
    );
}
