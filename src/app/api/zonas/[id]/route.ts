/**
 * src/app/api/zonas/[id]/route.ts
 *
 * GET   /api/zonas/[id] — Retorna una zona con sus reportes activos
 * PATCH /api/zonas/[id] — Actualiza la ocupación de una zona (solo admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { calcularPorcentaje, estadoZona } from "@/lib/utils";

// Schema de validación para PATCH
const patchSchema = z.object({
    ocupacionCarro: z.number().int().min(0).optional(),
    ocupacionMoto: z.number().int().min(0).optional(),
    activa: z.boolean().optional(),
});

// ─────────────────────────────────────────────────────────────
// GET /api/zonas/[id]
// ─────────────────────────────────────────────────────────────

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const zona = await prisma.zona.findUnique({
            where: { id },
            include: {
                reportes: {
                    where: {
                        activo: true,
                        expiraEn: { gt: new Date() },
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!zona) {
            return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 });
        }

        const pctCarro = calcularPorcentaje(zona.ocupacionCarro, zona.capacidadCarro);
        const pctMoto = calcularPorcentaje(zona.ocupacionMoto, zona.capacidadMoto);
        const pctGlobal = calcularPorcentaje(
            zona.ocupacionCarro + zona.ocupacionMoto,
            zona.capacidadCarro + zona.capacidadMoto
        );

        return NextResponse.json({
            id: zona.id,
            nombre: zona.nombre,
            slug: zona.slug,
            lat: zona.lat,
            lng: zona.lng,
            ubicacion: zona.ubicacion,
            accesoMasCercano: zona.accesoMasCercano,
            activa: zona.activa,
            carro: {
                capacidad: zona.capacidadCarro,
                ocupacion: zona.ocupacionCarro,
                disponibles: zona.capacidadCarro - zona.ocupacionCarro,
                porcentaje: pctCarro,
            },
            moto: {
                capacidad: zona.capacidadMoto,
                ocupacion: zona.ocupacionMoto,
                disponibles: zona.capacidadMoto - zona.ocupacionMoto,
                porcentaje: pctMoto,
            },
            estado: estadoZona(pctGlobal),
            reportesActivos: zona.reportes,
        });
    } catch (error) {
        console.error("[GET /api/zonas/[id]] Error:", error);
        return NextResponse.json({ error: "Error al obtener la zona" }, { status: 500 });
    }
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/zonas/[id]
// ─────────────────────────────────────────────────────────────

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const parsed = patchSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos", detalles: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const zona = await prisma.zona.findUnique({ where: { id } });
        if (!zona) {
            return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 });
        }

        // Validar que la ocupación no exceda la capacidad
        const nuevaOcupacionCarro = parsed.data.ocupacionCarro ?? zona.ocupacionCarro;
        const nuevaOcupacionMoto = parsed.data.ocupacionMoto ?? zona.ocupacionMoto;

        if (nuevaOcupacionCarro > zona.capacidadCarro) {
            return NextResponse.json(
                { error: `La ocupación de carros (${nuevaOcupacionCarro}) excede la capacidad (${zona.capacidadCarro})` },
                { status: 422 }
            );
        }
        if (nuevaOcupacionMoto > zona.capacidadMoto) {
            return NextResponse.json(
                { error: `La ocupación de motos (${nuevaOcupacionMoto}) excede la capacidad (${zona.capacidadMoto})` },
                { status: 422 }
            );
        }

        const zonaActualizada = await prisma.zona.update({
            where: { id },
            data: parsed.data,
        });

        return NextResponse.json({
            mensaje: "Zona actualizada",
            zona: zonaActualizada,
        });
    } catch (error) {
        console.error("[PATCH /api/zonas/[id]] Error:", error);
        return NextResponse.json({ error: "Error al actualizar la zona" }, { status: 500 });
    }
}
