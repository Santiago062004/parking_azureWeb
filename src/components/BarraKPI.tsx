/**
 * src/components/BarraKPI.tsx
 *
 * 3 mini-cards horizontales con métricas globales:
 * Total disponible / Ocupación % / Estado accesos (semáforo)
 */

"use client";

import { ParkingSquare, TrendingUp, TrafficCone } from "lucide-react";
import type { ZonasResponse, TraficoResponse } from "@/types";

interface BarraKPIProps {
    zonas: ZonasResponse;
    trafico: TraficoResponse;
}

const TRAFICO_SEMAFORO: Record<string, string> = {
    fluido: "text-[#C4D600]",
    moderado: "text-[#F97316]",
    congestionado: "text-[#EF4444]",
};

export function BarraKPI({ zonas, trafico }: BarraKPIProps) {
    const totalDisponibles = zonas.totalCeldas - zonas.totalOcupadas;

    // Estado del acceso más congestionado (peor caso)
    const peorAcceso = trafico.accesos.reduce((peor, acc) => {
        const orden = { fluido: 0, moderado: 1, congestionado: 2 };
        return (orden[acc.estado] ?? 0) > (orden[peor.estado] ?? 0) ? acc : peor;
    }, trafico.accesos[0]);

    const estadoAccesos =
        trafico.accesos.every((a) => a.estado === "fluido")
            ? "Fluidos"
            : trafico.accesos.some((a) => a.estado === "congestionado")
                ? "Congestionado"
                : "Moderado";

    const colorAcceso = TRAFICO_SEMAFORO[peorAcceso?.estado ?? "fluido"];

    return (
        <div className="grid grid-cols-3 gap-2">
            {/* Cupos disponibles */}
            <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-3 flex flex-col items-center gap-1">
                <ParkingSquare className="w-4 h-4 text-[#C4D600]" />
                <span className="text-lg font-bold text-white">{totalDisponibles.toLocaleString()}</span>
                <span className="text-[10px] text-[#94A3B8] text-center leading-tight">Cupos libres</span>
            </div>

            {/* Ocupación global */}
            <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-3 flex flex-col items-center gap-1">
                <TrendingUp className="w-4 h-4 text-[#F97316]" />
                <span className="text-lg font-bold text-white">{zonas.porcentajeGlobal}%</span>
                <span className="text-[10px] text-[#94A3B8] text-center leading-tight">Ocupación</span>
            </div>

            {/* Accesos */}
            <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-3 flex flex-col items-center gap-1">
                <TrafficCone className={`w-4 h-4 ${colorAcceso}`} />
                <span className={`text-sm font-bold ${colorAcceso}`}>{estadoAccesos}</span>
                <span className="text-[10px] text-[#94A3B8] text-center leading-tight">Accesos</span>
            </div>
        </div>
    );
}
