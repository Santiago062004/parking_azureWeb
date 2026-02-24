/**
 * src/components/ZonaCard.tsx
 *
 * Tarjeta de zona de parqueadero para la lista principal.
 * Muestra nombre, ubicación, barra de progreso, cupos disponibles
 * y badges de reportes activos.
 *
 * Al tocar navega a /zona/[slug] para el detalle completo.
 */

"use client";

import Link from "next/link";
import { MapPin, ChevronRight, AlertTriangle, CheckCircle, Car, Bike } from "lucide-react";
import { BarraProgreso } from "@/components/BarraProgreso";
import { BadgeEstado } from "@/components/BadgeEstado";
import type { Zona, TipoVehiculo } from "@/types";

interface ZonaCardProps {
    zona: Zona;
    tipoVehiculo: TipoVehiculo;
}

const ICONO_REPORTE: Record<string, string> = {
    fila_moderada: "🚗",
    congestion_severa: "🚨",
    lleno: "🅿️",
    hay_cupos: "✅",
    accidente: "⚠️",
};

const LABEL_REPORTE: Record<string, string> = {
    fila_moderada: "Fila moderada",
    congestion_severa: "Congestión severa",
    lleno: "Lleno",
    hay_cupos: "Hay cupos",
    accidente: "Accidente",
};

export function ZonaCard({ zona, tipoVehiculo }: ZonaCardProps) {
    const datos = tipoVehiculo === "carro" ? zona.carro : zona.moto;

    // Si es moto y la zona no admite motos
    if (tipoVehiculo === "moto" && zona.moto.capacidad === 0) {
        return (
            <div className="bg-[#1E293B]/60 border border-[#334155]/50 rounded-2xl p-4 opacity-50">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-semibold">{zona.nombre}</h3>
                        <p className="text-[#94A3B8] text-xs mt-0.5">No admite motos</p>
                    </div>
                    <Bike className="w-5 h-5 text-[#334155]" />
                </div>
            </div>
        );
    }

    const ultimoReporte = zona.reportes[0];
    const tiempoReporte = ultimoReporte
        ? Math.round((Date.now() - new Date(ultimoReporte.createdAt).getTime()) / 60000)
        : null;

    return (
        <Link href={`/zona/${zona.slug}`} className="block">
            <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4 active:scale-[0.98] transition-transform duration-100">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-white font-semibold text-base">{zona.nombre}</h3>
                            <BadgeEstado estado={zona.estado} />
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#94A3B8]" />
                            <span className="text-[#94A3B8] text-xs">{zona.ubicacion}</span>
                        </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#334155] mt-1 shrink-0" />
                </div>

                {/* Barra de ocupación */}
                <BarraProgreso
                    porcentaje={datos.porcentaje}
                    estado={zona.estado}
                    showPercent
                    height="normal"
                />

                {/* Cupos y tipo */}
                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1.5">
                        {tipoVehiculo === "carro"
                            ? <Car className="w-4 h-4 text-[#94A3B8]" />
                            : <Bike className="w-4 h-4 text-[#94A3B8]" />
                        }
                        <span className="text-white font-bold text-lg">{datos.disponibles}</span>
                        <span className="text-[#94A3B8] text-sm">cupos libres</span>
                    </div>
                    <span className="text-[#94A3B8] text-xs">{datos.capacidad} total</span>
                </div>

                {/* Badge de reportes activos */}
                {ultimoReporte && tiempoReporte !== null && (
                    <div className="mt-3 flex items-center gap-1.5 bg-[#0F172A] rounded-lg px-3 py-2">
                        <span className="text-sm">{ICONO_REPORTE[ultimoReporte.tipo] ?? "📢"}</span>
                        <span className="text-[#94A3B8] text-xs">
                            {LABEL_REPORTE[ultimoReporte.tipo] ?? ultimoReporte.tipo}
                            {" "}
                            <span className="text-[#C4D600]">
                                hace {tiempoReporte < 1 ? "<1 min" : `${tiempoReporte} min`}
                            </span>
                        </span>
                        {zona.reportesActivos > 1 && (
                            <span className="ml-auto text-xs text-[#94A3B8]">+{zona.reportesActivos - 1}</span>
                        )}
                    </div>
                )}
            </div>
        </Link>
    );
}
