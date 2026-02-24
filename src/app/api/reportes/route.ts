/**
 * src/app/api/reportes/route.ts
 *
 * GET  /api/reportes — Retorna reportes activos (no expirados)
 * POST /api/reportes — Crea un reporte de usuario con reglas de negocio
 *
 * Reglas de negocio:
 *   - Rate limit: máx 3 reportes por usuarioAnonId en 10 minutos
 *   - TTL por tipo: fila_moderada=15m, congestion_severa=20m, lleno=30m, hay_cupos=10m, accidente=45m
 *   - "hay_cupos" → reduce ocupación en -5 (efecto crowdsourced)
 *   - "lleno" → lleva la zona al 100% de ocupación
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { calcularExpiracion } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Validación de entrada
// ─────────────────────────────────────────────────────────────

const TIPOS_VALIDOS = [
    "fila_moderada",
    "congestion_severa",
    "lleno",
    "hay_cupos",
    "accidente",
] as const;

const reporteSchema = z.object({
    zonaId: z.string().min(1),
    tipo: z.enum(TIPOS_VALIDOS),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    usuarioAnonId: z.string().min(1).max(100).optional(),
});

const RATE_LIMIT_REPORTES = 3;
const RATE_LIMIT_MINUTOS = 10;

// ─────────────────────────────────────────────────────────────
// GET /api/reportes — Solo reportes activos y no expirados
// ─────────────────────────────────────────────────────────────

export async function GET() {
    try {
        const reportes = await prisma.reporte.findMany({
            where: {
                activo: true,
                expiraEn: { gt: new Date() },
            },
            include: {
                zona: { select: { nombre: true, slug: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ reportes });
    } catch (error) {
        console.error("[GET /api/reportes] Error:", error);
        return NextResponse.json({ error: "Error al obtener reportes" }, { status: 500 });
    }
}

// ─────────────────────────────────────────────────────────────
// POST /api/reportes — Crear reporte con lógica de negocio
// ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = reporteSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos", detalles: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { zonaId, tipo, lat, lng, usuarioAnonId } = parsed.data;

        // 1. Verificar que la zona existe
        const zona = await prisma.zona.findUnique({ where: { id: zonaId } });
        if (!zona) {
            return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 });
        }

        // 2. Rate limiting por usuarioAnonId
        if (usuarioAnonId) {
            const ventana = new Date();
            ventana.setMinutes(ventana.getMinutes() - RATE_LIMIT_MINUTOS);

            const reportesRecientes = await prisma.reporte.count({
                where: {
                    usuarioAnonId,
                    createdAt: { gt: ventana },
                },
            });

            if (reportesRecientes >= RATE_LIMIT_REPORTES) {
                return NextResponse.json(
                    {
                        error: `Límite de reportes alcanzado. Máximo ${RATE_LIMIT_REPORTES} reportes en ${RATE_LIMIT_MINUTOS} minutos.`,
                    },
                    { status: 429 }
                );
            }
        }

        // 3. Crear el reporte
        const expiraEn = calcularExpiracion(tipo);
        const reporte = await prisma.reporte.create({
            data: {
                zonaId,
                tipo,
                lat,
                lng,
                usuarioAnonId,
                expiraEn,
                confianza: 1.0,
            },
        });

        // 4. Efecto crowdsourced en la ocupación de la zona
        if (tipo === "hay_cupos") {
            // Reducir ocupación en 5, sin bajar de 0
            await prisma.zona.update({
                where: { id: zonaId },
                data: {
                    ocupacionCarro: { decrement: 5 },
                },
            });
            // Asegurarse de que no quede negativo
            const zonaActualizada = await prisma.zona.findUnique({ where: { id: zonaId } });
            if (zonaActualizada && zonaActualizada.ocupacionCarro < 0) {
                await prisma.zona.update({
                    where: { id: zonaId },
                    data: { ocupacionCarro: 0 },
                });
            }
        }

        if (tipo === "lleno") {
            // Marcar la zona al 100% de capacidad de carros
            await prisma.zona.update({
                where: { id: zonaId },
                data: { ocupacionCarro: zona.capacidadCarro },
            });
        }

        return NextResponse.json({ reporte }, { status: 201 });
    } catch (error) {
        console.error("[POST /api/reportes] Error:", error);
        return NextResponse.json({ error: "Error al crear el reporte" }, { status: 500 });
    }
}
