/**
 * src/lib/prisma.ts
 *
 * Singleton de Prisma Client (Prisma 5) para evitar múltiples instancias
 * en desarrollo (hot reload de Next.js crea conexiones nuevas con cada cambio).
 *
 * En producción, cada servidor tiene una sola instancia.
 * En desarrollo, reutilizamos la instancia global del proceso de Node.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

export default prisma;
