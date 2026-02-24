/**
 * src/types/index.ts
 *
 * Tipos TypeScript compartidos entre componentes del frontend.
 * Refleja exactamente la forma de los responses de la API.
 */

// ─────────────────────────────────────────────
// Zonas
// ─────────────────────────────────────────────

export interface OcupacionTipo {
    capacidad: number;
    ocupacion: number;
    disponibles: number;
    porcentaje: number;
}

export type EstadoZona = "disponible" | "moderado" | "critico" | "lleno";

export interface ReporteResumen {
    id: string;
    tipo: string;
    confianza: number;
    expiraEn: string;
    createdAt: string;
}

export interface Zona {
    id: string;
    nombre: string;
    slug: string;
    lat: number;
    lng: number;
    ubicacion: string;
    accesoMasCercano: string;
    carro: OcupacionTipo;
    moto: OcupacionTipo;
    estado: EstadoZona;
    reportesActivos: number;
    reportes: ReporteResumen[];
}

export interface ZonasResponse {
    zonas: Zona[];
    totalCeldas: number;
    totalOcupadas: number;
    porcentajeGlobal: number;
}

// ─────────────────────────────────────────────
// Tráfico
// ─────────────────────────────────────────────

export type EstadoTrafico = "fluido" | "moderado" | "congestionado";

export interface AccesoTrafico {
    punto: string;
    via: string;
    currentSpeed: number;
    freeFlowSpeed: number;
    congestionado: boolean;
    ratio: number;
    estado: EstadoTrafico;
    consultadoHace: string;
    esMock: boolean;
}

export interface TraficoResponse {
    accesos: AccesoTrafico[];
}

// ─────────────────────────────────────────────
// Mejor ruta
// ─────────────────────────────────────────────

export interface MejorRutaResponse {
    recomendacion: {
        zona: {
            id: string;
            nombre: string;
            slug: string;
            disponibles: number;
            porcentaje: number;
            estado: EstadoZona;
        };
        acceso: {
            via: string;
            estado: EstadoTrafico;
            velocidadActual: number;
            congestionado: boolean;
        } | null;
        razon: string;
        score: number;
        alternativa: {
            zona: string;
            disponibles: number;
            acceso: string;
            estadoAcceso: EstadoTrafico;
        } | null;
    };
    tipoVehiculo: "carro" | "moto";
    timestamp: string;
}

// ─────────────────────────────────────────────
// Reportes
// ─────────────────────────────────────────────

export type TipoReporte =
    | "fila_moderada"
    | "congestion_severa"
    | "lleno"
    | "hay_cupos"
    | "accidente";

export type TipoVehiculo = "carro" | "moto";
