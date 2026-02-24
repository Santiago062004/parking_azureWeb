/**
 * src/app/zona/[slug]/page.tsx
 *
 * Pantalla de Detalle de Zona
 *
 * Muestra:
 * - Ocupación desglosada por tipo (carro + moto)
 * - Estado del acceso más cercano (tráfico en tiempo real)
 * - Lista de reportes recientes (últimos 5)
 * - Botón "Reportar aquí" que abre el FAB pre-seleccionado
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Car, Bike, Navigation, Zap, ZapOff } from "lucide-react";
import { motion } from "framer-motion";
import { BarraProgreso } from "@/components/BarraProgreso";
import { BadgeEstado } from "@/components/BadgeEstado";
import { FABReporte } from "@/components/FABReporte";
import { ToastConfirmacion } from "@/components/ToastConfirmacion";
import { useReporte } from "@/hooks/useReporte";
import type { Zona, AccesoTrafico } from "@/types";

const LABEL_REPORTE: Record<string, string> = {
    fila_moderada: "🚗 Fila moderada",
    congestion_severa: "🚨 Congestión severa",
    lleno: "🅿️ Lleno",
    hay_cupos: "✅ Hay cupos",
    accidente: "⚠️ Accidente",
};

export default function PaginaDetalleZona() {
    const { slug } = useParams<{ slug: string }>();
    const router = useRouter();

    const [zona, setZona] = useState<Zona | null>(null);
    const [trafico, setTrafico] = useState<AccesoTrafico | null>(null);
    const [cargando, setCargando] = useState(true);

    const { estado: estadoReporte, mensaje, enviarReporte } = useReporte();

    useEffect(() => {
        async function cargar() {
            setCargando(true);
            try {
                // Buscar la zona por slug desde el listado
                const [zonasRes, traficoRes] = await Promise.all([
                    fetch("/api/zonas"),
                    fetch("/api/trafico"),
                ]);
                const { zonas } = await zonasRes.json();
                const { accesos } = await traficoRes.json();

                const zonaData: Zona | undefined = zonas.find((z: Zona) => z.slug === slug);
                if (zonaData) {
                    setZona(zonaData);
                    const accesoData = accesos.find(
                        (a: AccesoTrafico) => a.punto === zonaData.accesoMasCercano
                    );
                    setTrafico(accesoData ?? null);
                }
            } catch {
                // Silencioso
            } finally {
                setCargando(false);
            }
        }
        cargar();
    }, [slug]);

    if (cargando) {
        return (
            <div className="min-h-screen bg-[#0F172A] p-4 animate-pulse">
                <div className="h-6 bg-[#1E293B] rounded w-1/4 mb-6" />
                <div className="h-40 bg-[#1E293B] rounded-2xl mb-4" />
                <div className="h-24 bg-[#1E293B] rounded-2xl" />
            </div>
        );
    }

    if (!zona) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
                <p className="text-[#94A3B8]">Zona no encontrada</p>
            </div>
        );
    }

    const pctGlobal = zona.carro.capacidad + zona.moto.capacidad > 0
        ? Math.round(
            ((zona.carro.ocupacion + zona.moto.ocupacion) /
                (zona.carro.capacidad + zona.moto.capacidad)) *
            1000
        ) / 10
        : 0;

    const traficoBien = trafico && !trafico.congestionado;

    return (
        <div className="min-h-screen bg-[#0F172A] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#0F172A]/95 backdrop-blur-sm border-b border-[#334155]/50 px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#1E293B] border border-[#334155]"
                    aria-label="Volver"
                >
                    <ArrowLeft className="w-4 h-4 text-white" />
                </button>
                <div>
                    <h1 className="text-white font-bold text-base leading-none">{zona.nombre}</h1>
                    <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#94A3B8]" />
                        <span className="text-[#94A3B8] text-xs">{zona.ubicacion}</span>
                    </div>
                </div>
                <div className="ml-auto">
                    <BadgeEstado estado={zona.estado} size="md" />
                </div>
            </header>

            <main className="px-4 pt-4 max-w-md mx-auto space-y-4">
                {/* Ocupación global */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4"
                >
                    <h2 className="text-white font-semibold text-sm mb-4">Ocupación</h2>

                    {/* Desglose carro */}
                    {zona.carro.capacidad > 0 && (
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Car className="w-4 h-4 text-[#94A3B8]" />
                                <span className="text-[#94A3B8] text-sm">Carros</span>
                                <span className="ml-auto text-white font-bold">{zona.carro.disponibles} libres</span>
                            </div>
                            <BarraProgreso
                                porcentaje={zona.carro.porcentaje}
                                estado={zona.estado}
                                showPercent
                                height="thick"
                            />
                        </div>
                    )}

                    {/* Desglose moto */}
                    {zona.moto.capacidad > 0 ? (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Bike className="w-4 h-4 text-[#94A3B8]" />
                                <span className="text-[#94A3B8] text-sm">Motos</span>
                                <span className="ml-auto text-white font-bold">{zona.moto.disponibles} libres</span>
                            </div>
                            <BarraProgreso
                                porcentaje={zona.moto.porcentaje}
                                estado={zona.estado}
                                showPercent
                                height="thick"
                            />
                        </div>
                    ) : (
                        <p className="text-[#94A3B8] text-xs">Esta zona no admite motos</p>
                    )}
                </motion.section>

                {/* Estado del acceso */}
                {trafico && (
                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Navigation className="w-4 h-4 text-[#94A3B8]" />
                            <h2 className="text-white font-semibold text-sm">Acceso más cercano</h2>
                        </div>
                        <p className="text-[#94A3B8] text-xs mb-3">{trafico.via}</p>

                        <div className="flex items-center gap-3">
                            {traficoBien
                                ? <Zap className="w-5 h-5 text-[#C4D600]" />
                                : <ZapOff className="w-5 h-5 text-[#F97316]" />
                            }
                            <div>
                                <p className={`font-semibold capitalize ${traficoBien ? "text-[#C4D600]" : "text-[#F97316]"}`}>
                                    {trafico.estado}
                                </p>
                                <p className="text-[#94A3B8] text-xs">
                                    {trafico.currentSpeed} km/h
                                    {trafico.esMock && " (estimado)"}
                                </p>
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* Reportes recientes */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4"
                >
                    <h2 className="text-white font-semibold text-sm mb-3">Reportes recientes</h2>
                    {zona.reportes.length === 0 ? (
                        <p className="text-[#94A3B8] text-sm">Sin reportes activos</p>
                    ) : (
                        <ul className="space-y-2">
                            {zona.reportes.slice(0, 5).map((r) => {
                                const mins = Math.round(
                                    (Date.now() - new Date(r.createdAt).getTime()) / 60000
                                );
                                return (
                                    <li key={r.id} className="flex items-center justify-between">
                                        <span className="text-sm text-white">
                                            {LABEL_REPORTE[r.tipo] ?? r.tipo}
                                        </span>
                                        <span className="text-[#94A3B8] text-xs">
                                            hace {mins < 1 ? "<1" : mins} min
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </motion.section>
            </main>

            {/* FAB con zona pre-seleccionada */}
            <FABReporte
                zonaId={zona.id}
                zonaNombre={zona.nombre}
                onReporte={enviarReporte}
                enviando={estadoReporte === "enviando"}
            />

            <ToastConfirmacion
                visible={
                    estadoReporte === "ok" ||
                    estadoReporte === "error" ||
                    estadoReporte === "rate_limit"
                }
                mensaje={mensaje}
                tipo={
                    estadoReporte === "ok"
                        ? "ok"
                        : estadoReporte === "rate_limit"
                            ? "rate_limit"
                            : "error"
                }
            />
        </div>
    );
}
