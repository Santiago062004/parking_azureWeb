/**
 * src/app/api/trafico/route.ts
 *
 * GET /api/trafico
 *
 * Retorna el estado del tráfico en los dos accesos al campus EAFIT.
 * Los datos vienen del servicio tomtom.ts que maneja caché en DB (TTL 60s).
 * Si no hay API key, retorna datos mock realistas con flag `esMock: true`.
 */

import { NextResponse } from "next/server";
import { obtenerTraficoTodos } from "@/lib/tomtom";

export async function GET() {
    try {
        const accesos = await obtenerTraficoTodos(false);

        return NextResponse.json({ accesos });
    } catch (error) {
        console.error("[GET /api/trafico] Error:", error);
        return NextResponse.json(
            { error: "Error al obtener datos de tráfico" },
            { status: 500 }
        );
    }
}
