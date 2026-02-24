/**
 * src/app/api/zonas/route.ts
 *
 * GET /api/zonas — Retorna todas las zonas activas con métricas calculadas
 * POST /api/zonas — Crear una zona nueva (no usado en Fase 0+1, preparado para futuro)
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calcularPorcentaje, estadoZona } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// GET /api/zonas
// ─────────────────────────────────────────────────────────────

export async function GET() {
    try {
        const zonas = await prisma.zona.findMany({
            where: { activa: true },
            orderBy: { nombre: "asc" },
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

        // Calcular métricas globales
        let totalCeldas = 0;
        let totalOcupadas = 0;

        const zonasConMetricas = zonas.map((zona) => {
            const pctCarro = calcularPorcentaje(zona.ocupacionCarro, zona.capacidadCarro);
            const pctMoto = calcularPorcentaje(zona.ocupacionMoto, zona.capacidadMoto);

            // El estado global de la zona se basa en el tipo de mayor ocupación
            const pctGlobal = calcularPorcentaje(
                zona.ocupacionCarro + zona.ocupacionMoto,
                zona.capacidadCarro + zona.capacidadMoto
            );

            totalCeldas += zona.capacidadCarro + zona.capacidadMoto;
            totalOcupadas += zona.ocupacionCarro + zona.ocupacionMoto;

            return {
                id: zona.id,
                nombre: zona.nombre,
                slug: zona.slug,
                lat: zona.lat,
                lng: zona.lng,
                ubicacion: zona.ubicacion,
                accesoMasCercano: zona.accesoMasCercano,
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
                reportesActivos: zona.reportes.length,
                reportes: zona.reportes.map((r) => ({
                    id: r.id,
                    tipo: r.tipo,
                    confianza: r.confianza,
                    expiraEn: r.expiraEn,
                    createdAt: r.createdAt,
                })),
            };
        });

        const porcentajeGlobal = calcularPorcentaje(totalOcupadas, totalCeldas);

        return NextResponse.json({
            zonas: zonasConMetricas,
            totalCeldas,
            totalOcupadas,
            porcentajeGlobal,
        });
    } catch (error) {
        console.error("[GET /api/zonas] Error:", error);
        return NextResponse.json(
            { error: "Error al obtener las zonas" },
            { status: 500 }
        );
    }
}
