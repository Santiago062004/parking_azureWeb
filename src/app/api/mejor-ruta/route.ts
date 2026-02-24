/**
 * src/app/api/mejor-ruta/route.ts
 *
 * GET /api/mejor-ruta?tipo=carro|moto
 *
 * El endpoint más importante. Cruza datos de ocupación + tráfico
 * para recomendar la mejor zona y acceso al campus en tiempo real.
 *
 * Algoritmo de score:
 *   - disponibilidad_score = disponibles / capacidad (0 a 1)
 *   - trafico_score = fluido → 1.0 | moderado → 0.5 | congestionado → 0.2
 *   - score_final = (disponibilidad_score * 0.6) + (trafico_score * 0.4)
 *
 * Retorna la zona de mayor score como recomendación y la segunda como alternativa.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { obtenerTraficoTodos } from "@/lib/tomtom";
import { calcularPorcentaje, estadoZona } from "@/lib/utils";
import type { DatoTrafico } from "@/lib/tomtom";

type TipoVehiculo = "carro" | "moto";

// Score de tráfico según estado del acceso
const TRAFICO_SCORE: Record<string, number> = {
    fluido: 1.0,
    moderado: 0.5,
    congestionado: 0.2,
};

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const tipo = (searchParams.get("tipo") ?? "carro") as TipoVehiculo;

        if (tipo !== "carro" && tipo !== "moto") {
            return NextResponse.json(
                { error: 'El parámetro "tipo" debe ser "carro" o "moto"' },
                { status: 400 }
            );
        }

        // Obtener zonas activas
        const todasLasZonas = await prisma.zona.findMany({
            where: { activa: true },
        });

        // Obtener tráfico (con cache)
        const trafico = await obtenerTraficoTodos(false);
        const traficoMap = new Map<string, DatoTrafico>(
            trafico.map((t) => [t.punto, t])
        );

        // Calcular score para cada zona
        const zonasConScore = todasLasZonas
            .map((zona) => {
                const capacidad = tipo === "carro" ? zona.capacidadCarro : zona.capacidadMoto;
                const ocupacion = tipo === "carro" ? zona.ocupacionCarro : zona.ocupacionMoto;

                // Filtrar zonas sin capacidad para el tipo seleccionado
                if (capacidad === 0) return null;

                const disponibles = capacidad - ocupacion;

                // Filtrar zonas sin disponibilidad
                if (disponibles <= 0) return null;

                const disponibilidadScore = disponibles / capacidad;
                const traficoData = traficoMap.get(zona.accesoMasCercano);
                const traficoScore = traficoData
                    ? (TRAFICO_SCORE[traficoData.estado] ?? 0.5)
                    : 0.5;

                const scoreFinal = disponibilidadScore * 0.6 + traficoScore * 0.4;

                const pctTotal = calcularPorcentaje(ocupacion, capacidad);

                return {
                    zona: {
                        id: zona.id,
                        nombre: zona.nombre,
                        slug: zona.slug,
                        lat: zona.lat,
                        lng: zona.lng,
                        ubicacion: zona.ubicacion,
                        disponibles,
                        porcentaje: pctTotal,
                        estado: estadoZona(pctTotal),
                    },
                    acceso: traficoData
                        ? {
                            via: traficoData.via,
                            estado: traficoData.estado,
                            velocidadActual: traficoData.currentSpeed,
                            congestionado: traficoData.congestionado,
                        }
                        : null,
                    scoreFinal,
                };
            })
            .filter(Boolean)
            .sort((a, b) => b!.scoreFinal - a!.scoreFinal) as NonNullable<
                ReturnType<typeof todasLasZonas["map"]>[number]
            >[];

        if (zonasConScore.length === 0) {
            return NextResponse.json(
                { error: "No hay zonas disponibles para el tipo de vehículo seleccionado" },
                { status: 404 }
            );
        }

        const mejor = zonasConScore[0];
        const alternativa = zonasConScore[1] ?? null;

        // Generar texto de razón legible
        const traficoTexto = mejor.acceso?.congestionado
            ? `aunque el acceso por ${mejor.acceso.via} tiene tráfico`
            : `y el acceso por ${mejor.acceso?.via ?? "la vía más cercana"} está fluido`;

        const razon = `${mejor.zona.nombre} tiene ${mejor.zona.disponibles} cupos disponibles ${traficoTexto}.`;

        return NextResponse.json({
            recomendacion: {
                zona: mejor.zona,
                acceso: mejor.acceso,
                razon,
                score: Math.round(mejor.scoreFinal * 100) / 100,
                alternativa: alternativa
                    ? {
                        zona: alternativa.zona.nombre,
                        disponibles: alternativa.zona.disponibles,
                        acceso: alternativa.acceso?.via ?? "desconocido",
                        estadoAcceso: alternativa.acceso?.estado ?? "desconocido",
                    }
                    : null,
            },
            tipoVehiculo: tipo,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[GET /api/mejor-ruta] Error:", error);
        return NextResponse.json(
            { error: "Error al calcular la mejor ruta" },
            { status: 500 }
        );
    }
}
