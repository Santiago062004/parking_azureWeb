/**
 * src/lib/tomtom.ts
 *
 * Servicio de tráfico que consulta la TomTom Traffic Flow API.
 *
 * Estrategia de caché:
 *   1. Revisar TraficoCache en DB: si fue consultado hace < 60s, retornar cache.
 *   2. Si el cache expiró (o no existe), hacer fetch a TomTom.
 *   3. Guardar resultado en DB.
 *   4. Si la API key no existe o falla, retornar datos mock realistas.
 *
 * Esto protege el límite de requests gratuitos de TomTom (~2500/día en plan free).
 */

import prisma from "@/lib/prisma";
import { estadoTrafico, tiempoRelativo } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Configuración de puntos de acceso monitoreados
// ─────────────────────────────────────────────────────────────

const CACHE_TTL_SEGUNDOS = 60;

interface PuntoAcceso {
    punto: string;
    via: string;
    lat: number;
    lng: number;
}

const PUNTOS_ACCESO: PuntoAcceso[] = [
    {
        punto: "vegas",
        via: "Av. Las Vegas",
        lat: 6.202,
        lng: -75.577,
    },
    {
        punto: "cra49",
        via: "Cra 49 / Regional",
        lat: 6.202,
        lng: -75.581,
    },
];

// ─────────────────────────────────────────────────────────────
// Tipos de respuesta
// ─────────────────────────────────────────────────────────────

export interface DatoTrafico {
    punto: string;
    via: string;
    currentSpeed: number;
    freeFlowSpeed: number;
    congestionado: boolean;
    ratio: number;
    estado: "fluido" | "moderado" | "congestionado";
    consultadoHace: string;
    esMock: boolean;
}

// ─────────────────────────────────────────────────────────────
// Datos mock (fallback cuando no hay API key o falla TomTom)
// Representan condiciones típicas a media mañana en Medellín
// ─────────────────────────────────────────────────────────────

const MOCK_POR_PUNTO: Record<string, { currentSpeed: number; freeFlowSpeed: number }> = {
    vegas: { currentSpeed: 35, freeFlowSpeed: 50 },  // fluido
    cra49: { currentSpeed: 18, freeFlowSpeed: 45 },  // congestionado
};

// ─────────────────────────────────────────────────────────────
// Lógica principal
// ─────────────────────────────────────────────────────────────

/**
 * Obtiene datos de tráfico para un punto de acceso.
 * Si el cache es fresco (< 60s), lo retorna directamente.
 * Si no, consulta TomTom y actualiza el cache.
 */
async function obtenerTrafico(
    acceso: PuntoAcceso,
    forzarRefresh = false
): Promise<DatoTrafico> {
    const ahora = new Date();

    // 1. Buscar en cache
    if (!forzarRefresh) {
        const cache = await prisma.traficoCache.findUnique({
            where: { punto: acceso.punto },
        });

        if (cache) {
            const segundosDesdeConsulta =
                (ahora.getTime() - cache.consultadoEn.getTime()) / 1000;

            if (segundosDesdeConsulta < CACHE_TTL_SEGUNDOS) {
                const { estado, ratio, congestionado } = estadoTrafico(
                    cache.currentSpeed,
                    cache.freeFlowSpeed
                );
                return {
                    punto: acceso.punto,
                    via: acceso.via,
                    currentSpeed: cache.currentSpeed,
                    freeFlowSpeed: cache.freeFlowSpeed,
                    congestionado,
                    ratio,
                    estado,
                    consultadoHace: tiempoRelativo(cache.consultadoEn),
                    esMock: false,
                };
            }
        }
    }

    // 2. Intentar fetch real a TomTom
    const apiKey = process.env.TOMTOM_API_KEY;
    if (apiKey) {
        try {
            const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?key=${apiKey}&point=${acceso.lat},${acceso.lng}`;
            const resp = await fetch(url, { cache: "no-store" });

            if (resp.ok) {
                const data = await resp.json();
                const seg = data.flowSegmentData;
                const currentSpeed: number = seg.currentSpeed;
                const freeFlowSpeed: number = seg.freeFlowSpeed;
                const confidence: number = seg.confidence ?? 1;

                // Guardar/actualizar cache
                const { congestionado: congReal } = estadoTrafico(currentSpeed, freeFlowSpeed);
                await prisma.traficoCache.upsert({
                    where: { punto: acceso.punto },
                    update: { currentSpeed, freeFlowSpeed, congestionado: congReal, confidence, consultadoEn: ahora },
                    create: {
                        punto: acceso.punto,
                        currentSpeed,
                        freeFlowSpeed,
                        congestionado: congReal,
                        confidence,
                        consultadoEn: ahora,
                    },
                });

                const { estado, ratio, congestionado } = estadoTrafico(currentSpeed, freeFlowSpeed);
                return {
                    punto: acceso.punto,
                    via: acceso.via,
                    currentSpeed,
                    freeFlowSpeed,
                    congestionado,
                    ratio,
                    estado,
                    consultadoHace: "ahora",
                    esMock: false,
                };
            }
        } catch {
            // Falla silenciosa: cae al mock
        }
    }

    // 3. Fallback: datos mock
    const mock = MOCK_POR_PUNTO[acceso.punto] ?? { currentSpeed: 30, freeFlowSpeed: 50 };
    const { estado, ratio, congestionado } = estadoTrafico(mock.currentSpeed, mock.freeFlowSpeed);

    // Persistir mock en cache para tener datos consistentes
    await prisma.traficoCache.upsert({
        where: { punto: acceso.punto },
        update: {
            currentSpeed: mock.currentSpeed,
            freeFlowSpeed: mock.freeFlowSpeed,
            congestionado,
            consultadoEn: ahora,
        },
        create: {
            punto: acceso.punto,
            currentSpeed: mock.currentSpeed,
            freeFlowSpeed: mock.freeFlowSpeed,
            congestionado,
            consultadoEn: ahora,
        },
    });

    return {
        punto: acceso.punto,
        via: acceso.via,
        currentSpeed: mock.currentSpeed,
        freeFlowSpeed: mock.freeFlowSpeed,
        congestionado,
        ratio,
        estado,
        consultadoHace: "ahora",
        esMock: true,
    };
}

/**
 * Obtiene datos de tráfico para ambos accesos al campus.
 * Exportado para uso en los API routes.
 */
export async function obtenerTraficoTodos(forzarRefresh = false): Promise<DatoTrafico[]> {
    return Promise.all(
        PUNTOS_ACCESO.map((acceso) => obtenerTrafico(acceso, forzarRefresh))
    );
}

/**
 * Obtiene datos de un único acceso por su clave ("vegas" | "cra49").
 */
export async function obtenerTraficoPunto(
    punto: string,
    forzarRefresh = false
): Promise<DatoTrafico | null> {
    const acceso = PUNTOS_ACCESO.find((p) => p.punto === punto);
    if (!acceso) return null;
    return obtenerTrafico(acceso, forzarRefresh);
}
