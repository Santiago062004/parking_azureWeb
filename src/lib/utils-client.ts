/**
 * src/lib/utils-client.ts
 *
 * Versión client-safe de las utilidades puras.
 * Exporta las mismas funciones que utils.ts pero sin imports de servidor
 * (Prisma, etc.) para poder usarlas en componentes 'use client'.
 *
 * La fórmula Haversine se duplica aquí porque utils.ts puede crear
 * problemas de bundling si se importa directamente en el cliente.
 */

export function haversine(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type EstadoZona = "disponible" | "moderado" | "critico" | "lleno";

export const COLOR_POR_ESTADO: Record<EstadoZona, string> = {
    disponible: "#C4D600",
    moderado: "#F97316",
    critico: "#EF4444",
    lleno: "#EF4444",
};
