/**
 * src/components/FABReporte.tsx
 *
 * Floating Action Button para crear reportes.
 * Al tocar el botón +, expande un bottom sheet con opciones de reporte.
 * Usa Framer Motion para animación suave de apertura.
 */

"use client";

import { useState } from "react";
import { Plus, X, CheckCircle, AlertTriangle, AlertOctagon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { TipoReporte } from "@/types";

interface FABReporteProps {
    zonaId?: string;
    zonaNombre?: string;
    onReporte: (zonaId: string, tipo: TipoReporte) => void;
    zonas?: Array<{ id: string; nombre: string }>;
    enviando: boolean;
}

const OPCIONES_REPORTE: Array<{
    tipo: TipoReporte;
    label: string;
    emoji: string;
    color: string;
}> = [
        { tipo: "hay_cupos", label: "Hay cupos", emoji: "✅", color: "text-[#C4D600]" },
        { tipo: "fila_moderada", label: "Hay fila", emoji: "🚗", color: "text-[#F97316]" },
        { tipo: "congestion_severa", label: "Congestión", emoji: "🚨", color: "text-[#EF4444]" },
        { tipo: "lleno", label: "Lleno", emoji: "🅿️", color: "text-[#EF4444]" },
        { tipo: "accidente", label: "Accidente", emoji: "⚠️", color: "text-[#EF4444]" },
    ];

export function FABReporte({
    zonaId,
    zonaNombre,
    onReporte,
    zonas = [],
    enviando,
}: FABReporteProps) {
    const [abierto, setAbierto] = useState(false);
    const [zonaSeleccionada, setZonaSeleccionada] = useState(zonaId ?? "");

    const handleReporte = (tipo: TipoReporte) => {
        if (!zonaSeleccionada) return;
        onReporte(zonaSeleccionada, tipo);
        setAbierto(false);
    };

    return (
        <>
            {/* Overlay */}
            <AnimatePresence>
                {abierto && (
                    <motion.div
                        key="overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-40"
                        onClick={() => setAbierto(false)}
                    />
                )}
            </AnimatePresence>

            {/* Bottom sheet */}
            <AnimatePresence>
                {abierto && (
                    <motion.div
                        key="sheet"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-[#1E293B] border-t border-[#334155] rounded-t-3xl p-6 max-w-md mx-auto"
                    >
                        {/* Handle */}
                        <div className="w-10 h-1 bg-[#334155] rounded-full mx-auto mb-5" />

                        <h3 className="text-white font-semibold text-base mb-1">Reportar condición</h3>
                        {(zonaNombre || zonaSeleccionada) && (
                            <p className="text-[#94A3B8] text-sm mb-4">
                                {zonaNombre ?? zonas.find((z) => z.id === zonaSeleccionada)?.nombre ?? ""}
                            </p>
                        )}

                        {/* Selector de zona si no hay zona pre-seleccionada */}
                        {!zonaId && zonas.length > 0 && (
                            <select
                                value={zonaSeleccionada}
                                onChange={(e) => setZonaSeleccionada(e.target.value)}
                                className="w-full bg-[#0F172A] border border-[#334155] text-white rounded-xl px-3 py-2.5 mb-4 text-sm focus:outline-none focus:border-[#C4D600]"
                            >
                                <option value="">Selecciona una zona...</option>
                                {zonas.map((z) => (
                                    <option key={z.id} value={z.id}>{z.nombre}</option>
                                ))}
                            </select>
                        )}

                        {/* Opciones de reporte */}
                        <div className="grid grid-cols-1 gap-2">
                            {OPCIONES_REPORTE.map((op) => (
                                <button
                                    key={op.tipo}
                                    onClick={() => handleReporte(op.tipo)}
                                    disabled={!zonaSeleccionada || enviando}
                                    className="flex items-center gap-3 bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-left active:scale-[0.98] transition-transform disabled:opacity-40"
                                >
                                    <span className="text-xl">{op.emoji}</span>
                                    <span className={`font-medium ${op.color}`}>{op.label}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setAbierto(false)}
                            className="w-full mt-4 py-3 text-[#94A3B8] text-sm"
                        >
                            Cancelar
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FAB button */}
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setAbierto(!abierto)}
                disabled={enviando}
                className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-[#C4D600] text-[#0F172A] rounded-full shadow-lg shadow-[#C4D600]/30 flex items-center justify-center"
                aria-label="Crear reporte"
            >
                <AnimatePresence mode="wait">
                    {abierto
                        ? <motion.div key="x" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>
                            <X className="w-6 h-6" />
                        </motion.div>
                        : <motion.div key="plus" initial={{ rotate: 90 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }}>
                            <Plus className="w-6 h-6" />
                        </motion.div>
                    }
                </AnimatePresence>
            </motion.button>
        </>
    );
}
