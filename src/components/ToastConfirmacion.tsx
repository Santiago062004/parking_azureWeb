/**
 * src/components/ToastConfirmacion.tsx
 *
 * Toast de confirmación que aparece después de enviar un reporte.
 * Se posiciona arriba de la pantalla con animación slide-down.
 * Se auto-descarta después de 3 segundos.
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

interface ToastProps {
    visible: boolean;
    mensaje: string;
    tipo: "ok" | "error" | "rate_limit";
}

const CONFIG = {
    ok: { icon: CheckCircle, bg: "bg-[#C4D600]", text: "text-[#0F172A]" },
    error: { icon: AlertCircle, bg: "bg-[#EF4444]", text: "text-white" },
    rate_limit: { icon: Clock, bg: "bg-[#F97316]", text: "text-white" },
};

export function ToastConfirmacion({ visible, mensaje, tipo }: ToastProps) {
    const { icon: Icon, bg, text } = CONFIG[tipo] ?? CONFIG.ok;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: -60, x: "-50%" }}
                    animate={{ opacity: 1, y: 0, x: "-50%" }}
                    exit={{ opacity: 0, y: -60, x: "-50%" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={`fixed top-4 left-1/2 z-[100] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl ${bg} ${text} max-w-[90vw]`}
                >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-semibold">{mensaje}</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
