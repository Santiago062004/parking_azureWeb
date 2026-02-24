/**
 * src/components/IndicadorActualizando.tsx
 *
 * Indicador visual sutil que muestra cuando se están
 * actualizando los datos en background (polling).
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface Props {
    actualizando: boolean;
    ultimaActualizacion: Date | null;
}

function horaFormato(fecha: Date): string {
    return fecha.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

export function IndicadorActualizando({ actualizando, ultimaActualizacion }: Props) {
    return (
        <div className="flex items-center gap-1.5 text-[#94A3B8] text-xs">
            <AnimatePresence mode="wait">
                {actualizando ? (
                    <motion.div
                        key="spin"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <RefreshCw className="w-3 h-3 text-[#C4D600]" />
                    </motion.div>
                ) : (
                    <motion.div key="dot" className="w-2 h-2 rounded-full bg-[#C4D600]" />
                )}
            </AnimatePresence>
            {ultimaActualizacion && (
                <span>
                    {actualizando ? "Actualizando..." : `Actualizado ${horaFormato(ultimaActualizacion)}`}
                </span>
            )}
        </div>
    );
}
