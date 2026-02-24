/**
 * src/app/page.tsx
 *
 * Pantalla Principal — App Usuario (Fase 2)
 * Mobile-first, < 768px
 *
 * Estructura:
 *   A. Header fijo: logo + toggle Carro/Moto + indicador actualización
 *   B. Body scrolleable:
 *       - Hero "MEJOR RUTA AHORA"
 *       - Barra KPI (3 mini-cards)
 *       - Lista de zonas ordenadas por disponibilidad
 *   C. FAB de reporte (fijo, esquina inferior derecha)
 *   D. Toast de confirmación
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { ParkingSquare, Map, Shield } from "lucide-react";
import { ToggleTipoVehiculo } from "@/components/ToggleTipoVehiculo";
import { HeroMejorRuta } from "@/components/HeroMejorRuta";
import { BarraKPI } from "@/components/BarraKPI";
import { ZonaCard } from "@/components/ZonaCard";
import { FABReporte } from "@/components/FABReporte";
import { ToastConfirmacion } from "@/components/ToastConfirmacion";
import { IndicadorActualizando } from "@/components/IndicadorActualizando";
import { useParking } from "@/hooks/useParking";
import { useReporte } from "@/hooks/useReporte";
import type { TipoVehiculo } from "@/types";

export default function PaginaPrincipal() {
  const [tipoVehiculo, setTipoVehiculo] = useState<TipoVehiculo>("carro");
  const { zonas, trafico, mejorRuta, cargando, actualizando, ultimaActualizacion } =
    useParking(tipoVehiculo);
  const { estado: estadoReporte, mensaje, enviarReporte } = useReporte();

  // Ordenar zonas por disponibilidad (más cupos primero)
  const zonasOrdenadas = zonas
    ? [...zonas.zonas].sort((a, b) => {
      const dispA = tipoVehiculo === "carro" ? a.carro.disponibles : a.moto.disponibles;
      const dispB = tipoVehiculo === "carro" ? b.carro.disponibles : b.moto.disponibles;
      return dispB - dispA;
    })
    : [];

  return (
    <div className="min-h-screen bg-[#0F172A] pb-24">
      {/* ── A. Header fijo ───────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-[#0F172A]/95 backdrop-blur-sm border-b border-[#334155]/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#004B87] rounded-xl flex items-center justify-center">
              <ParkingSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-white text-sm font-bold leading-none">Smart Parking</h1>
              <span className="text-[#94A3B8] text-[10px]">EAFIT</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón mapa */}
            <Link
              href="/mapa"
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#1E293B] border border-[#334155]"
              aria-label="Ver mapa"
            >
              <Map className="w-4 h-4 text-[#94A3B8]" />
            </Link>

            {/* Botón admin */}
            <Link
              href="/admin"
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#1E293B] border border-[#334155]"
              aria-label="Dashboard admin"
            >
              <Shield className="w-4 h-4 text-[#94A3B8]" />
            </Link>

            {/* Toggle carro/moto */}
            <ToggleTipoVehiculo value={tipoVehiculo} onChange={setTipoVehiculo} />
          </div>
        </div>

        {/* Indicador de actualización */}
        <div className="flex justify-center mt-1.5">
          <IndicadorActualizando
            actualizando={actualizando}
            ultimaActualizacion={ultimaActualizacion}
          />
        </div>
      </header>

      {/* ── B. Contenido scrolleable ─────────────────────────── */}
      <main className="px-4 pt-4 max-w-md mx-auto space-y-4">
        {/* Hero mejor ruta */}
        <HeroMejorRuta data={mejorRuta} cargando={cargando} />

        {/* KPIs globales */}
        {zonas && trafico && (
          <BarraKPI zonas={zonas} trafico={trafico} />
        )}

        {/* Lista de zonas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold text-sm">
              Zonas del campus
            </h2>
            <span className="text-[#94A3B8] text-xs">
              {tipoVehiculo === "carro" ? "🚗 Carros" : "🏍️ Motos"}
            </span>
          </div>

          {cargando ? (
            // Skeleton loaders
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4 animate-pulse"
                >
                  <div className="h-4 bg-[#334155] rounded w-2/3 mb-3" />
                  <div className="h-2 bg-[#334155] rounded w-full mb-3" />
                  <div className="h-4 bg-[#334155] rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {zonasOrdenadas.map((zona) => (
                <ZonaCard key={zona.id} zona={zona} tipoVehiculo={tipoVehiculo} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── C. FAB de reporte ────────────────────────────────── */}
      <FABReporte
        zonas={zonas?.zonas.map((z) => ({ id: z.id, nombre: z.nombre })) ?? []}
        onReporte={enviarReporte}
        enviando={estadoReporte === "enviando"}
      />

      {/* ── D. Toast de confirmación ─────────────────────────── */}
      <ToastConfirmacion
        visible={estadoReporte === "ok" || estadoReporte === "error" || estadoReporte === "rate_limit"}
        mensaje={mensaje}
        tipo={estadoReporte === "ok" ? "ok" : estadoReporte === "rate_limit" ? "rate_limit" : "error"}
      />
    </div>
  );
}
