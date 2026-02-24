# Documentación Técnica - EAFIT Smart Parking

## 1) Resumen del proyecto
EAFIT Smart Parking es una aplicación web construida con Next.js (App Router) para visualizar disponibilidad de parqueaderos (carro/moto), reportes colaborativos de usuarios y estado de tráfico de accesos al campus en tiempo real.

Componentes principales:
- Frontend de usuario (móvil-first): home, mapa y detalle de zona.
- Frontend administrativo (desktop): KPIs, feed de reportes y control manual de ocupación.
- Backend API (Next Route Handlers): zonas, reportes, tráfico y recomendación de mejor ruta.
- Persistencia con Prisma + SQLite (`prisma/dev.db`).

## 2) Arquitectura actual
### Flujo general
1. El frontend consulta cada 30s (usuario) o 15s (admin):
- `GET /api/zonas`
- `GET /api/trafico`
- `GET /api/mejor-ruta?tipo=carro|moto`
2. La API lee datos de Prisma/SQLite.
3. Tráfico usa caché de 60s en `TraficoCache` y, si no hay API key/falla TomTom, usa datos mock.
4. Los reportes de usuario (`POST /api/reportes`) aplican reglas de rate limit y modifican ocupación en algunos casos (`hay_cupos`, `lleno`).

### Stack técnico
- Next.js 16 + React 19 + TypeScript.
- Tailwind v4 (sin `tailwind.config.ts`, usando `@theme` en CSS).
- Prisma ORM.
- Leaflet/React-Leaflet para mapa.
- Framer Motion para animaciones.
- Zod para validación de payloads.

## 3) Modelo de datos (Prisma)
Archivo: `parking-git/prisma/schema.prisma`

### Tabla `Zona`
Representa parqueaderos físicos.
Campos clave:
- Identidad: `id`, `nombre`, `slug`.
- Geografía: `lat`, `lng`, `ubicacion`, `accesoMasCercano`.
- Capacidad/ocupación: `capacidadCarro`, `capacidadMoto`, `ocupacionCarro`, `ocupacionMoto`.
- Estado lógico: `activa`.
- Trazabilidad: `createdAt`, `updatedAt`.

### Tabla `Reporte`
Eventos crowdsourced de usuarios.
Campos clave:
- `zonaId`, `tipo`, `lat/lng` opcional, `usuarioAnonId` opcional.
- `confianza`, `expiraEn`, `activo`, `createdAt`.
- Índices: `(zonaId, activo)`, `(expiraEn)`.

### Tabla `TraficoCache`
Caché de estado de accesos (`vegas`, `cra49`) con TTL lógico de 60s.

## 4) API backend (qué hace cada endpoint)
### `src/app/api/zonas/route.ts`
- `GET /api/zonas`: retorna zonas activas con métricas calculadas (porcentaje, disponibles, estado global), reportes activos y KPIs globales (`totalCeldas`, `totalOcupadas`, `porcentajeGlobal`).

### `src/app/api/zonas/[id]/route.ts`
- `GET /api/zonas/:id`: detalle de una zona con reportes activos.
- `PATCH /api/zonas/:id`: actualiza ocupación y/o estado `activa`, validando que no exceda capacidad.

### `src/app/api/reportes/route.ts`
- `GET /api/reportes`: reportes activos no expirados.
- `POST /api/reportes`: crea reporte con validación Zod + rate limit (3 reportes/10 min por `usuarioAnonId`).
- Reglas de negocio:
  - `hay_cupos`: decrementa ocupación de carros en 5 (sin negativos).
  - `lleno`: fuerza ocupación de carros a capacidad máxima.

### `src/app/api/reportes/feed/route.ts`
- `GET /api/reportes/feed`: últimos 50 reportes (incluye recientes expirados) para monitoreo admin.

### `src/app/api/trafico/route.ts`
- `GET /api/trafico`: devuelve estado de accesos (`vegas`, `cra49`) desde servicio TomTom + caché.

### `src/app/api/trafico/refresh/route.ts`
- `POST /api/trafico/refresh`: fuerza actualización de caché de tráfico (ignora TTL).

### `src/app/api/mejor-ruta/route.ts`
- `GET /api/mejor-ruta?tipo=carro|moto`:
  - Cruza disponibilidad de zonas + estado de tráfico.
  - Score: `score = disponibilidad*0.6 + trafico*0.4`.
  - Devuelve mejor recomendación y alternativa.

## 5) Frontend (páginas)
### `src/app/page.tsx`
Pantalla principal usuario:
- Header con toggle Carro/Moto, acceso a mapa y admin.
- Hero de mejor ruta.
- KPIs globales.
- Lista de zonas ordenada por disponibilidad.
- FAB de reporte + toast.

### `src/app/mapa/page.tsx`
Pantalla mapa:
- Carga dinámica de Leaflet (`ssr: false`).
- Muestra zonas, accesos, ubicación del usuario y leyenda.
- Integra notificaciones y geofencing (`useTracking`).
- Incluye modal de detección externa y FAB de reporte.

### `src/app/zona/[slug]/page.tsx`
Detalle de zona:
- Ocupación por tipo, estado de acceso cercano y reportes recientes.
- Permite reportar directamente para esa zona.

### `src/app/admin/page.tsx`
Dashboard admin (desktop):
- Columna izquierda: KPIs globales + feed de reportes.
- Columna derecha: tarjetas de zonas con controles de ajuste ocupación.
- Botón para forzar refresh de tráfico.

### `src/app/layout.tsx` y `src/app/globals.css`
Layout raíz, metadata SEO y estilos globales (paleta EAFIT + ajustes Leaflet).

## 6) Hooks (lógica cliente)
### `src/hooks/useParking.ts`
Hook central del usuario. Fetch concurrente de zonas/tráfico/mejor-ruta y polling cada 30s.

### `src/hooks/useReporte.ts`
Crea reportes de usuario con geolocalización opcional y manejo de estado/toast.

### `src/hooks/useAdminDashboard.ts`
Hook admin con polling cada 15s, detección de reportes nuevos, patch de ocupación y refresh tráfico.

### `src/hooks/useTracking.ts`
Geolocalización + geofencing:
- Detecta entrada/salida de zonas y ajusta ocupación (+1/-1).
- Detecta usuario estático en perímetro para sugerir reporte (modal).

### `src/hooks/useNotificaciones.ts`
Maneja Notification API:
- Notifica cambio de mejor ruta.
- Notifica cuando una vía pasa de congestionada a fluida.

## 7) Componentes UI
### Usuario
- `src/components/HeroMejorRuta.tsx`: bloque principal de recomendación.
- `src/components/BarraKPI.tsx`: 3 KPIs resumidos.
- `src/components/ZonaCard.tsx`: tarjeta de zona en listado.
- `src/components/BadgeEstado.tsx`: badge de estado (disponible/moderado/crítico/lleno).
- `src/components/BarraProgreso.tsx`: barra animada de ocupación.
- `src/components/ToggleTipoVehiculo.tsx`: switch carro/moto.
- `src/components/IndicadorActualizando.tsx`: feedback de polling.
- `src/components/FABReporte.tsx`: creación de reportes desde bottom sheet.
- `src/components/ToastConfirmacion.tsx`: confirmaciones de envío/errores/rate limit.

### Mapa
- `src/components/MapaCampus.tsx`: render Leaflet de zonas, accesos y usuario.
- `src/components/ModalDeteccionExterna.tsx`: modal de reporte sugerido por geofencing externo.

### Admin
- `src/components/admin/KPIsGlobales.tsx`: ocupación global, desglose por zona y accesos.
- `src/components/admin/FeedReportes.tsx`: stream de reportes con resaltado de nuevos.
- `src/components/admin/ZonaCardAdmin.tsx`: edición de ocupación por zona (carro/moto).

## 8) Librerías internas y tipos
- `src/lib/prisma.ts`: singleton de Prisma Client.
- `src/lib/tomtom.ts`: integración de tráfico con caché DB + fallback mock.
- `src/lib/utils.ts`: funciones puras (porcentaje, estado, TTL reportes, tráfico, tiempo relativo, haversine).
- `src/lib/utils-client.ts`: utilidades client-safe (evita imports server-only).
- `src/types/index.ts`: contratos TS de respuestas API y modelos de UI.

## 9) Configuración e infraestructura actual
- `package.json`: scripts (`dev`, `build`, `start`, `seed`) y dependencias.
- `prisma/seed.ts`: inserta 5 zonas iniciales de EAFIT con ocupación simulada.
- `prisma/dev.db`: base de datos SQLite local para desarrollo.
- `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `prisma.config.ts`: configuración de framework/ORM/build.

## 10) Alcance futuro: conteo de carros con IoT
Objetivo: pasar de ocupación manual/crowdsourced a ocupación automática y confiable en tiempo casi real.

### Alcance funcional recomendado
1. Detección por entrada/salida en cada zona (eventos `IN`/`OUT`).
2. Cálculo de ocupación en backend por eventos (no por update manual).
3. Trazabilidad por dispositivo sensor y nivel de confianza.
4. Modo híbrido: IoT + reportes usuario (el IoT domina, el reporte ajusta confianza/alertas).
5. Observabilidad: métricas de latencia, pérdida de eventos, sensores caídos.

### Arquitectura sugerida (Azure-friendly)
1. Sensores físicos por acceso/zona (lazo inductivo, cámara con analítica o ultrasonido según presupuesto).
2. Gateway local (ESP32/RPi o edge industrial) publica mensajes MQTT/HTTPS.
3. Ingesta en nube:
- Opción A: Azure IoT Hub.
- Opción B: Azure Event Hubs (si ya hay broker externo).
4. Procesamiento:
- Azure Functions/Container App consume eventos y actualiza ocupación.
- Reglas anti-rebote, deduplicación por `eventId`, y reintentos idempotentes.
5. Persistencia:
- Tabla de eventos crudos (`SensorEvent`) + tabla agregada de estado actual por zona.

### Cambios de datos recomendados
Agregar entidades nuevas:
- `Sensor`: id, zonaId, tipoSensor, estado, ultimaSeñal.
- `SensorEvent`: idempotencyKey, sensorId, zonaId, tipoEvento(IN/OUT), timestamp, confianza.
- `ZonaOcupacionHistorica`: snapshots por minuto para analítica.

### Reglas de negocio IoT
- Ocupación = acumulado de eventos validos, acotado entre 0 y capacidad.
- Si hay discrepancia entre sensor y reporte de usuario, no pisar directo; generar bandera de revisión.
- Detección de sensor fallando: heartbeat > N minutos sin señal.

## 11) Migración futura de BD a Azure
Situación actual: SQLite local (`file:./prisma/dev.db`).
Objetivo: BD administrada en Azure, multiusuario y productiva.

### Opción recomendada
Usar Azure Database for PostgreSQL Flexible Server con Prisma (`provider = "postgresql"`).
Motivos:
- Muy compatible con Prisma en producción.
- Escalable, backups y alta disponibilidad administrada.
- Mejor ecosistema para analítica y extensiones.

### Ruta de migración propuesta
1. Provisionar PostgreSQL en Azure + reglas de red + SSL.
2. Definir `DATABASE_URL` de Azure en variables de entorno.
3. Cambiar datasource Prisma:
- De `provider = "sqlite"` a `provider = "postgresql"`.
4. Generar y aplicar migraciones Prisma en nuevo motor.
5. Migrar datos iniciales:
- Exportar zonas/reportes desde SQLite (script ETL o seed de transición).
- Cargar en Azure Postgres.
6. Validar consistencia:
- Conteos por tabla, pruebas API, smoke tests de UI.
7. Cutover:
- Desplegar app apuntando solo a Azure.
- Mantener rollback temporal (snapshot de SQLite + backup de Azure).

### Consideraciones operativas
- Conexiones: usar pooler (PgBouncer/Azure options) si crece tráfico.
- Seguridad: secretos en Azure Key Vault.
- Observabilidad: métricas de latencia SQL, deadlocks, CPU y storage.
- Backups: política diaria + retención alineada a negocio.

## 12) Riesgos técnicos actuales detectados
1. `useTracking.ts` actualiza ocupación con geofencing cliente (+1/-1) sin autenticación fuerte: útil para demo, riesgoso para producción.
2. No hay auth/roles en endpoints admin (`PATCH /api/zonas/:id`, `POST /api/trafico/refresh`).
3. Rate limiting está en aplicación y depende de `usuarioAnonId` del cliente (fácil de eludir).
4. Falta suite de pruebas automatizadas (unitarias/integración/e2e).

## 13) Carpeta `parking` vs `parking-git`
En el workspace existen dos carpetas:
- `parking-git`: código fuente limpio (documentado en este archivo).
- `parking`: contiene gran volumen de archivos generados/dependencias.

Para mantenimiento y documentación técnica, este documento tomó como fuente `parking-git`.

