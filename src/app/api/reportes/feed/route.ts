/**
 * src/app/api/reportes/feed/route.ts
 *
 * GET /api/reportes/feed
 *
 * Feed para el dashboard admin. Retorna los últimos 50 reportes
 * incluyendo tanto activos como expirados recientes (para contexto
 * histórico). Útil para monitoreo en tiempo real.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const reportes = await prisma.reporte.findMany({
            take: 50,
            orderBy: { createdAt: "desc" },
            include: {
                zona: { select: { id: true, nombre: true, slug: true } },
            },
        });

        return NextResponse.json({ reportes });
    } catch (error) {
        console.error("[GET /api/reportes/feed] Error:", error);
        return NextResponse.json({ error: "Error al obtener el feed" }, { status: 500 });
    }
}
