-- CreateTable
CREATE TABLE "Zona" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "capacidadCarro" INTEGER NOT NULL,
    "capacidadMoto" INTEGER NOT NULL,
    "ocupacionCarro" INTEGER NOT NULL DEFAULT 0,
    "ocupacionMoto" INTEGER NOT NULL DEFAULT 0,
    "ubicacion" TEXT NOT NULL,
    "accesoMasCercano" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reporte" (
    "id" TEXT NOT NULL,
    "zonaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "usuarioAnonId" TEXT,
    "confianza" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TraficoCache" (
    "id" TEXT NOT NULL,
    "punto" TEXT NOT NULL,
    "currentSpeed" DOUBLE PRECISION NOT NULL,
    "freeFlowSpeed" DOUBLE PRECISION NOT NULL,
    "congestionado" BOOLEAN NOT NULL,
    "confidence" DOUBLE PRECISION,
    "consultadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TraficoCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Zona_slug_key" ON "Zona"("slug");

-- CreateIndex
CREATE INDEX "Reporte_zonaId_activo_idx" ON "Reporte"("zonaId", "activo");

-- CreateIndex
CREATE INDEX "Reporte_expiraEn_idx" ON "Reporte"("expiraEn");

-- CreateIndex
CREATE UNIQUE INDEX "TraficoCache_punto_key" ON "TraficoCache"("punto");

-- AddForeignKey
ALTER TABLE "Reporte" ADD CONSTRAINT "Reporte_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "Zona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
