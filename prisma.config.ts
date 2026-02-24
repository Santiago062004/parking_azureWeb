/**
 * prisma.config.ts
 *
 * Configuración de Prisma v7+.
 * En Prisma 7, la URL de la base de datos ya no se define en schema.prisma
 * sino en este archivo de configuración.
 *
 * Documentación: https://pris.ly/d/config-datasource
 */

import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
    earlyAccess: true,
    schema: path.join(__dirname, "prisma", "schema.prisma"),
    migrate: {
        adapter: async () => {
            // SQLite local usando better-sqlite3 o driver nativo
            // Para producción, cambiar a PlanetScale / Supabase adapter
            const { PrismaLibSQL } = await import("@prisma/adapter-libsql");
            const { createClient } = await import("@libsql/client");

            const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
            const client = createClient({ url: databaseUrl });
            return new PrismaLibSQL(client);
        },
    },
});
