/**
 * src/lib/utils.ts
 *
 * Funciones utilitarias puras (sin dependencias externas ni acceso a DB).
 * Todas las funciones son síncronas y testeables de forma independiente.
 */

// ─────────────────────────────────────────────────────────────
// Geo
// ─────────────────────────────────────────────────────────────

/**
 * Calcula la distancia en metros entre dos coordenadas geográficas
 * usando la fórmula de Haversine.
 */
export function haversine(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371000; // Radio de la Tierra en metros
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // metros
}

// ─────────────────────────────────────────────────────────────
// Zonas
// ─────────────────────────────────────────────────────────────

export type EstadoZona = "disponible" | "moderado" | "critico" | "lleno";

/**
 * Determina el estado visual de una zona en base a su porcentaje de ocupación.
 *
 * < 70%  → disponible (verde lima)
 * 70-89% → moderado   (naranja)
 * 90-99% → critico    (rojo)
 * 100%   → lleno      (rojo parpadeante)
 */
export function estadoZona(porcentaje: number): EstadoZona {
    if (porcentaje >= 100) return "lleno";
    if (porcentaje >= 90) return "critico";
    if (porcentaje >= 70) return "moderado";
    return "disponible";
}

/**
 * Calcula el porcentaje de ocupación redondeado a 1 decimal.
 * Retorna 0 si la capacidad es 0 (zonas sin motos, etc.)
 */
export function calcularPorcentaje(ocupacion: number, capacidad: number): number {
    if (capacidad === 0) return 0;
    return Math.round((ocupacion / capacidad) * 1000) / 10;
}

// ─────────────────────────────────────────────────────────────
// Reportes
// ─────────────────────────────────────────────────────────────

export type TipoReporte =
    | "fila_moderada"
    | "congestion_severa"
    | "lleno"
    | "hay_cupos"
    | "accidente";

/**
 * TTL de cada tipo de reporte en minutos.
 * Los reportes críticos duran más para tener mayor impacto.
 */
const TTL_POR_TIPO: Record<TipoReporte, number> = {
    fila_moderada: 15,
    congestion_severa: 20,
    lleno: 30,
    hay_cupos: 10,
    accidente: 45,
};

/**
 * Retorna el tiempo de vida (en minutos) para un tipo de reporte.
 * Usa 15 minutos como default para tipos desconocidos.
 */
export function ttlReporte(tipo: string): number {
    return TTL_POR_TIPO[tipo as TipoReporte] ?? 15;
}

/**
 * Indica si un reporte ya expiró según su timestamp de expiración.
 */
export function reporteExpirado(expiraEn: Date): boolean {
    return new Date() > expiraEn;
}

/**
 * Calcula la fecha de expiración de un reporte a partir de ahora.
 */
export function calcularExpiracion(tipo: string): Date {
    const minutos = ttlReporte(tipo);
    const expira = new Date();
    expira.setMinutes(expira.getMinutes() + minutos);
    return expira;
}

// ─────────────────────────────────────────────────────────────
// Tráfico
// ─────────────────────────────────────────────────────────────

export type EstadoTrafico = "fluido" | "moderado" | "congestionado";

/**
 * Determina el estado del tráfico basado en la relación velocidad actual / velocidad libre.
 *
 * ratio > 0.70 → fluido
 * ratio 0.50-0.70 → moderado
 * ratio < 0.50 → congestionado
 */
export function estadoTrafico(
    currentSpeed: number,
    freeFlowSpeed: number
): { congestionado: boolean; estado: EstadoTrafico; ratio: number } {
    const ratio = freeFlowSpeed > 0 ? currentSpeed / freeFlowSpeed : 1;
    const redondeado = Math.round(ratio * 100) / 100;

    let estado: EstadoTrafico;
    if (ratio >= 0.7) {
        estado = "fluido";
    } else if (ratio >= 0.5) {
        estado = "moderado";
    } else {
        estado = "congestionado";
    }

    return {
        congestionado: ratio < 0.7,
        estado,
        ratio: redondeado,
    };
}

// ─────────────────────────────────────────────────────────────
// Tiempo relativo
// ─────────────────────────────────────────────────────────────

/**
 * Convierte una fecha pasada a una string legible como "hace 3 min", "hace 45s".
 */
export function tiempoRelativo(fecha: Date): string {
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();
    const diffSeg = Math.floor(diffMs / 1000);

    if (diffSeg < 60) return `${diffSeg}s`;
    const diffMin = Math.floor(diffSeg / 60);
    if (diffMin < 60) return `${diffMin} min`;
    const diffHoras = Math.floor(diffMin / 60);
    return `${diffHoras}h`;
}
