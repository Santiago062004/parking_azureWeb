/**
 * src/components/ModalDeteccionExterna.tsx
 *
 * Modal que aparece cuando useTracking detecta que el usuario
 * lleva >1.5 minutos estático en el perímetro del campus.
 *
 * Opciones:
 *   - Reportar fila para zona específica (Guayabos, Vegas, etc.)
 *   - Solo tráfico (descartar)
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X } from "lucide-react";
import type { Zona, TipoReporte } from "@/types";

interface ModalDeteccionExternaProps {
    visible: boolean;
    zonas: Zona[];
    onReporte: (zonaId: string, tipo: TipoReporte) => void;
    onCerrar: () => void;
}

const OPCIONES_FILA: Array<{ tipo: TipoReporte; label: string; emoji: string }> = [
    { tipo: "fila_moderada", label: "Fila moderada", emoji: "🚗" },
    { tipo: "congestion_severa", label: "Congestión", emoji: "🚨" },
];

export function ModalDeteccionExterna({
    visible,
    zonas,
    onReporte,
    onCerrar,
}: ModalDeteccionExternaProps) {
    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* Overlay */}
                    <motion.div
                        key="overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 z-50"
                        onClick={onCerrar}
                    />

                    {/* Modal */}
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[60] bg-[#1E293B] border border-[#334155] rounded-3xl p-6 max-w-sm mx-auto"
                    >
                        {/* Cerrar */}
                        <button
                            onClick={onCerrar}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl bg-[#0F172A]"
                            aria-label="Cerrar"
                        >
                            <X className="w-4 h-4 text-[#94A3B8]" />
                        </button>

                        {/* Ícono */}
                        <div className="w-12 h-12 bg-[#004B87]/30 rounded-2xl flex items-center justify-center mb-4">
                            <MapPin className="w-6 h-6 text-[#C4D600]" />
                        </div>

                        <h2 className="text-white font-bold text-lg mb-1">
                            ¿Estás haciendo fila?
                        </h2>
                        <p className="text-[#94A3B8] text-sm mb-5">
                            Parece que estás detenido cerca a EAFIT. Ayuda a la comunidad reportando la condición del tráfico.
                        </p>

                        {/* Zonas + tipos de reporte */}
                        <div className="space-y-2 mb-4">
                            {zonas.slice(0, 4).map((zona) =>
                                OPCIONES_FILA.map((op) => (
                                    <button
                                        key={`${zona.id}-${op.tipo}`}
                                        onClick={() => {
                                            onReporte(zona.id, op.tipo);
                                            onCerrar();
                                        }}
                                        className="w-full flex items-center gap-3 bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-2.5 text-left active:scale-[0.98] transition-transform"
                                    >
                                        <span className="text-base">{op.emoji}</span>
                                        <div>
                                            <p className="text-white text-sm font-medium">{op.label}</p>
                                            <p className="text-[#94A3B8] text-xs">para {zona.nombre}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        <button
                            onClick={onCerrar}
                            className="w-full py-3 text-[#94A3B8] text-sm text-center"
                        >
                            Solo tráfico, no reportar
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
