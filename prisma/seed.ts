/**
 * prisma/seed.ts
 *
 * Pobla la base de datos con las 5 zonas reales del campus EAFIT.
 * Ejecutar con: npx prisma db seed
 *
 * Nota: Las ocupaciones iniciales son valores simulados para demo (40-90%),
 * representativos de un período de alta demanda (mañana de clases).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const zonasData = [
  {
    nombre: "Guayabos",
    slug: "guayabos",
    lat: 6.2009,
    lng: -75.5768,
    capacidadCarro: 267,
    capacidadMoto: 120,
    ubicacion: "Norte",
    accesoMasCercano: "vegas",
    // ~60% ocupación inicial
    ocupacionCarro: 160,
    ocupacionMoto: 55,
  },
  {
    nombre: "Sigma / Plásticos",
    slug: "sigma-plasticos",
    lat: 6.1995,
    lng: -75.5788,
    capacidadCarro: 435,
    capacidadMoto: 0,
    ubicacion: "Centro-Oeste",
    accesoMasCercano: "cra49",
    // ~67% ocupación inicial
    ocupacionCarro: 290,
    ocupacionMoto: 0,
  },
  {
    nombre: "Ingeniería Sur / Bravo",
    slug: "ingenieria-bravo",
    lat: 6.1989,
    lng: -75.5805,
    capacidadCarro: 194,
    capacidadMoto: 320,
    ubicacion: "Sur-Oeste",
    accesoMasCercano: "cra49",
    // ~72% / ~63% ocupación inicial
    ocupacionCarro: 140,
    ocupacionMoto: 200,
  },
  {
    nombre: "Vegas / Empleados",
    slug: "vegas-empleados",
    lat: 6.2001,
    lng: -75.5776,
    capacidadCarro: 95,
    capacidadMoto: 0,
    ubicacion: "Oriente",
    accesoMasCercano: "vegas",
    // ~84% ocupación inicial → estado "moderado"
    ocupacionCarro: 80,
    ocupacionMoto: 0,
  },
  {
    nombre: "Sótano / VIP",
    slug: "sotano-vip",
    lat: 6.1985,
    lng: -75.5798,
    capacidadCarro: 10,
    capacidadMoto: 0,
    ubicacion: "Sur",
    accesoMasCercano: "cra49",
    // ~80% ocupación inicial → estado "moderado"
    ocupacionCarro: 8,
    ocupacionMoto: 0,
  },
];

async function main() {
  console.log("🌱 Iniciando seed de EAFIT Smart Parking...");

  // Eliminar datos anteriores para mantener idempotencia
  await prisma.reporte.deleteMany();
  await prisma.traficoCache.deleteMany();
  await prisma.zona.deleteMany();

  // Insertar zonas
  for (const zona of zonasData) {
    const created = await prisma.zona.create({ data: zona });
    console.log(`  ✅ Zona creada: ${created.nombre} (${created.slug})`);
  }

  console.log(`\n✨ Seed completado: ${zonasData.length} zonas insertadas.`);
  console.log("   Total celdas: 1441 (1001 carros + 440 motos)");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
