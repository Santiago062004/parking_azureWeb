/**
 * src/components/admin/FeedReportes.tsx
 *
 * Panel izquierdo inferior: feed de reportes en tiempo real.
 * Los reportes nuevos entran con animación slide-in (Framer Motion).
 * Muestra los últimos 50 reportes (activos + expirados recientes).
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare } from "lucide-react";

interface Reporte {
    id: string;
    tipo: string;
    zonaId: string;
    zona?: { nombre: string };
    confianza: number;
    expiraEn: string;
    createdAt: string;
}

interface FeedReportesProps {
    reportes: Reporte[];
    reportesNuevos: Set<string>;
    zonaNames: Record<string, string>; // id → nombre
}

const ICONO: Record<string, string> = {
    fila_moderada: "🚗",
    congestion_severa: "🚨",
    lleno: "🅿️",
    hay_cupos: "✅",
    accidente: "⚠️",
};

const LABEL: Record<string, string> = {
    fila_moderada: "Fila moderada",
    congestion_severa: "Congestión severa",
    lleno: "Lleno",
    hay_cupos: "Hay cupos",
    accidente: "Accidente",
};

const COLOR: Record<string, string> = {
    fila_moderada: "#F97316",
    congestion_severa: "#EF4444",
    lleno: "#EF4444",
    hay_cupos: "#C4D600",
    accidente: "#EF4444",
};

function tiempoRelativo(fecha: string): string {
    const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
}

function estaActivo(expiraEn: string): boolean {
    return new Date(expiraEn).getTime() > Date.now();
}

export function FeedReportes({ reportes, reportesNuevos, zonaNames }: FeedReportesProps) {
    if (reportes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
                <MessageSquare className="w-8 h-8 text-[#334155]" />
                <p className="text-[#94A3B8] text-sm">Sin reportes aún</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <AnimatePresence initial={false}>
                {reportes.map((r) => {
                    const esNuevo = reportesNuevos.has(r.id);
                    const activo = estaActivo(r.expiraEn);
                    const color = COLOR[r.tipo] ?? "#94A3B8";
                    const zonaNombre = zonaNames[r.zonaId] ?? "Zona desconocida";

                    return (
                        <motion.div
                            key={r.id}
                            initial={esNuevo ? { opacity: 0, x: -20 } : false}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-opacity ${activo
                                    ? "bg-[#0F172A] border-[#334155]"
                                    : "bg-[#0F172A]/50 border-[#334155]/40 opacity-50"
                                } ${esNuevo ? "ring-1 ring-[#C4D600]/40" : ""}`}
                        >
                            {/* Ícono */}
                            <span className="text-lg leading-none mt-0.5">{ICONO[r.tipo] ?? "📢"}</span>

                            {/* Contenido */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-medium" style={{ color }}>
                                        {LABEL[r.tipo] ?? r.tipo}
                                    </span>
                                    <span className="text-[#94A3B8] text-xs shrink-0">
                                        {tiempoRelativo(r.createdAt)}
                                    </span>
                                </div>
                                <p className="text-[#94A3B8] text-xs truncate mt-0.5">{zonaNombre}</p>

                                {/* Barra de confianza */}
                                <div className="mt-1.5 flex items-center gap-1.5">
                                    <div className="flex-1 h-1 bg-[#1E293B] rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${r.confianza * 100}%`,
                                                backgroundColor: r.confianza > 0.7 ? "#C4D600"
                                                    : r.confianza > 0.4 ? "#F97316" : "#EF4444",
                                            }}
                                        />
                                    </div>
                                    <span className="text-[#94A3B8] text-[10px]">
                                        {Math.round(r.confianza * 100)}%
                                    </span>
                                </div>
                            </div>

                            {/* Dot activo */}
                            {activo && (
                                <div className="w-1.5 h-1.5 rounded-full bg-[#C4D600] mt-1.5 shrink-0" />
                            )}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
