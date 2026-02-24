/**
 * src/app/api/trafico/refresh/route.ts
 *
 * POST /api/trafico/refresh
 *
 * Fuerza un refresh del cache de tráfico ignorando el TTL de 60s.
 * Solo debe ser llamado desde el dashboard admin.
 */

import { NextResponse } from "next/server";
import { obtenerTraficoTodos } from "@/lib/tomtom";

export async function POST() {
    try {
        const accesos = await obtenerTraficoTodos(true /* forzarRefresh */);

        return NextResponse.json({
            mensaje: "Cache de tráfico actualizado",
            accesos,
        });
    } catch (error) {
        console.error("[POST /api/trafico/refresh] Error:", error);
        return NextResponse.json(
            { error: "Error al refrescar tráfico" },
            { status: 500 }
        );
    }
}
