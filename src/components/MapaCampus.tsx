/**
 * src/components/MapaCampus.tsx
 *
 * Mapa interactivo del campus EAFIT usando Leaflet + React-Leaflet.
 * Se carga solo en el cliente (dynamic import) porque Leaflet usa window.
 *
 * Características:
 * - Tile layer OpenStreetMap
 * - Marcadores de zona con color según estado de ocupación
 * - Anillo animado (pulse) alrededor de cada pin con CSS
 * - Popup con datos de ocupación al hacer click
 * - Marcadores especiales para los accesos (Vegas y Cra49) con semáforo de tráfico
 * - Bounds centrados en el campus EAFIT
 * - Pin de posición del usuario (si geolocalización activa)
 */

"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Zona, AccesoTrafico, EstadoZona } from "@/types";
import type { PosicionUsuario } from "@/hooks/useTracking";

// Bounds del campus EAFIT (SW → NE)
const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
    [6.198, -75.581],
    [6.202, -75.576],
];

const COLOR_ZONA: Record<EstadoZona, string> = {
    disponible: "#C4D600",
    moderado: "#F97316",
    critico: "#EF4444",
    lleno: "#EF4444",
};

const COLOR_TRAFICO: Record<string, string> = {
    fluido: "#C4D600",
    moderado: "#F97316",
    congestionado: "#EF4444",
};

// Componente auxiliar: ajusta los bounds cuando cambia el mapa
function AjustarBounds() {
    const map = useMap();
    useEffect(() => {
        map.fitBounds(CAMPUS_BOUNDS, { padding: [20, 20] });
    }, [map]);
    return null;
}

interface MapaCampusProps {
    zonas: Zona[];
    accesos: AccesoTrafico[];
    posicion?: PosicionUsuario | null;
}

export function MapaCampus({ zonas, accesos, posicion }: MapaCampusProps) {
    return (
        <MapContainer
            bounds={CAMPUS_BOUNDS}
            style={{ height: "100%", width: "100%", background: "#0F172A" }}
            zoomControl={false}
            attributionControl={false}
        >
            <AjustarBounds />

            {/* Tile layer OpenStreetMap con filtro oscuro */}
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                className="map-tiles-dark"
            />

            {/* Marcadores de zonas */}
            {zonas.map((zona) => {
                const color = COLOR_ZONA[zona.estado];
                const radio = zona.carro.disponibles > 100 ? 18 : zona.carro.disponibles > 30 ? 14 : 10;

                return (
                    <div key={zona.id}>
                        {/* Anillo exterior (pulsante para z. críticas) */}
                        <CircleMarker
                            center={[zona.lat, zona.lng]}
                            radius={radio + 8}
                            pathOptions={{
                                color,
                                fillColor: color,
                                fillOpacity: 0.15,
                                weight: 1,
                                opacity: 0.4,
                            }}
                        />
                        {/* Pin principal */}
                        <CircleMarker
                            center={[zona.lat, zona.lng]}
                            radius={radio}
                            pathOptions={{
                                color,
                                fillColor: color,
                                fillOpacity: 0.9,
                                weight: 2,
                            }}
                        >
                            <Popup className="parking-popup">
                                <div style={{ fontFamily: "Inter, sans-serif", color: "#fff", background: "#1E293B", borderRadius: "12px", padding: "12px", minWidth: "180px" }}>
                                    <strong style={{ fontSize: "14px" }}>{zona.nombre}</strong>
                                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: color }}>
                                        {zona.carro.disponibles} cupos de carro
                                    </p>
                                    {zona.moto.capacidad > 0 && (
                                        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94A3B8" }}>
                                            {zona.moto.disponibles} cupos de moto
                                        </p>
                                    )}
                                    <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#94A3B8" }}>
                                        {zona.ubicacion} · {zona.reportesActivos > 0 ? `${zona.reportesActivos} reportes` : "Sin reportes"}
                                    </p>
                                </div>
                            </Popup>
                        </CircleMarker>
                    </div>
                );
            })}

            {/* Marcadores de accesos al campus */}
            {accesos.map((acceso) => {
                const color = COLOR_TRAFICO[acceso.estado] ?? "#94A3B8";
                const coords: Record<string, [number, number]> = {
                    vegas: [6.202, -75.577],
                    cra49: [6.202, -75.581],
                };
                const pos = coords[acceso.punto];
                if (!pos) return null;

                return (
                    <CircleMarker
                        key={acceso.punto}
                        center={pos}
                        radius={12}
                        pathOptions={{
                            color,
                            fillColor: color,
                            fillOpacity: 0.7,
                            weight: 2,
                            dashArray: "4 4",
                        }}
                    >
                        <Popup className="parking-popup">
                            <div style={{ fontFamily: "Inter, sans-serif", color: "#fff", background: "#1E293B", borderRadius: "12px", padding: "12px" }}>
                                <strong style={{ fontSize: "13px" }}>{acceso.via}</strong>
                                <p style={{ margin: "4px 0 0", fontSize: "12px", color }}>
                                    {acceso.estado.charAt(0).toUpperCase() + acceso.estado.slice(1)}
                                </p>
                                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#94A3B8" }}>
                                    {acceso.currentSpeed} km/h{acceso.esMock ? " (estimado)" : ""}
                                </p>
                            </div>
                        </Popup>
                    </CircleMarker>
                );
            })}

            {/* Pin del usuario */}
            {posicion && (
                <CircleMarker
                    center={[posicion.lat, posicion.lng]}
                    radius={8}
                    pathOptions={{
                        color: "#ffffff",
                        fillColor: "#004B87",
                        fillOpacity: 1,
                        weight: 2,
                    }}
                >
                    <Popup>
                        <div style={{ fontFamily: "Inter, sans-serif", color: "#fff", background: "#1E293B", borderRadius: "10px", padding: "10px" }}>
                            <strong style={{ fontSize: "12px" }}>Tu ubicación</strong>
                            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#94A3B8" }}>
                                Precisión: ±{Math.round(posicion.precision)}m
                            </p>
                        </div>
                    </Popup>
                </CircleMarker>
            )}
        </MapContainer>
    );
}
