# Documentación Técnica para Desarrolladores - EAFIT Smart Parking

## 1. Propósito de este documento
Este documento describe el sistema con foco en implementación para desarrolladores: dependencias, módulos, flujo de datos, contratos API, reglas de negocio, persistencia y riesgos técnicos.

Documento funcional/general: `parking-git/DOCUMENTACION_PROYECTO.md`
Documento técnico (este): `parking-git/DOCUMENTACION_DESARROLLADOR.md`

## 2. Stack y runtime
- Framework: Next.js 16 (App Router)
- UI: React 19
- Lenguaje: TypeScript
- ORM: Prisma
- BD actual: SQLite local
- Estilos: TailwindCSS v4 (config en CSS con `@theme`)
- Animaciones: Framer Motion
- Mapas: Leaflet + React-Leaflet
- Iconografía: Lucide
- Validación de payloads: Zod

## 3. Dependencias del proyecto (package.json)
Archivo: `parking-git/package.json`

### 3.1 Dependencias de producción
- `next`
  - Runtime principal SSR/CSR, routing y API handlers en `src/app/api/*`.
- `react`, `react-dom`
  - Renderizado de componentes cliente.
- `@prisma/client`
  - Cliente ORM tipado para operaciones DB en API/lib.
- `prisma`
  - CLI y toolchain de schema/migraciones/seed.
- `zod`
  - Validación de payloads en endpoints (`reportes`, `zonas/[id]`).
- `leaflet`
  - Motor de mapas.
- `react-leaflet`
  - Binding React para Leaflet.
- `framer-motion`
  - Animaciones UI (modales, toasts, entradas de tarjetas).
- `lucide-react`
  - Íconos SVG React.
- `@types/leaflet`
  - Tipos TS para Leaflet (está en dependencies pero funcionalmente es de desarrollo).

### 3.2 Dependencias de desarrollo
- `typescript`
  - Compilación y chequeo de tipos.
- `ts-node`
  - Ejecución de seed TypeScript.
- `@types/node`, `@types/react`, `@types/react-dom`
  - Tipado para entorno Node/React.
- `tailwindcss`, `@tailwindcss/postcss`
  - Pipeline CSS de Tailwind v4.
- `babel-plugin-react-compiler`
  - Soporte para React Compiler cuando está habilitado.

### 3.3 Scripts
- `npm run dev`
  - Levanta app en modo desarrollo (hot reload).
- `npm run build`
  - Build producción.
- `npm run start`
  - Sirve build producción.
- `npm run seed`
  - Ejecuta seeding Prisma (`prisma/seed.ts`).

## 4. Configuración y bootstrapping
### 4.1 `next.config.ts`
- `reactCompiler: true`
- Indica uso del compilador de React en build/runtime compatible.

### 4.2 `tsconfig.json`
- `strict: true`
- Alias `@/* -> ./src/*`
- `moduleResolution: bundler` (alineado a Next moderno).

### 4.3 `postcss.config.mjs`
- Activa plugin `@tailwindcss/postcss`.

### 4.4 `prisma.config.ts`
- Config Prisma moderna (adapter pattern).
- Define schema en `prisma/schema.prisma`.
- Usa `@prisma/adapter-libsql` + `@libsql/client` para URL `DATABASE_URL`.

## 5. Modelo de datos
Archivo: `parking-git/prisma/schema.prisma`

### 5.1 `Zona`
Entidad de parqueadero físico.
- Clave funcional: `slug`.
- Capacidades por tipo y ocupación actual.
- `accesoMasCercano` conecta con dominio de tráfico (`vegas`, `cra49`).
- `activa` permite soft-disable.

### 5.2 `Reporte`
Evento crowdsourced.
- Tipo cerrado: `fila_moderada | congestion_severa | lleno | hay_cupos | accidente`.
- `expiraEn` + `activo` definen vigencia.
- `usuarioAnonId` soporta rate limit básico.

### 5.3 `TraficoCache`
Estado de accesos a campus.
- Caché por `punto` único.
- Campos suficientes para recalcular estado en lectura.

## 6. Seed y datos base
Archivo: `parking-git/prisma/seed.ts`
- Inserta 5 zonas del campus con coordenadas, capacidades y ocupación inicial simulada.
- Limpia tablas antes de insertar (idempotencia funcional de seed).

## 7. Capa backend/API (Route Handlers)
Todas las rutas viven en `src/app/api/*`.

### 7.1 `/api/zonas` (`src/app/api/zonas/route.ts`)
- `GET`: lista zonas activas + reportes no expirados.
- Calcula en servidor:
  - Disponibles por tipo.
  - Porcentajes por tipo/global.
  - Estado visual (`estadoZona`).
  - KPIs globales.

### 7.2 `/api/zonas/[id]` (`src/app/api/zonas/[id]/route.ts`)
- `GET`: detalle de una zona con reportes activos.
- `PATCH`: actualiza `ocupacionCarro`, `ocupacionMoto`, `activa`.
- Valida:
  - Enteros >= 0.
  - Ocupación no puede exceder capacidad.

### 7.3 `/api/reportes` (`src/app/api/reportes/route.ts`)
- `GET`: reportes activos/no expirados.
- `POST`: crea reporte.
- Reglas:
  - Zod schema estricto.
  - Rate limit de 3 reportes/10 min por `usuarioAnonId`.
  - Efecto en ocupación:
    - `hay_cupos`: decremento de carros en 5 con clamp a 0.
    - `lleno`: set a capacidad máxima de carros.

### 7.4 `/api/reportes/feed` (`src/app/api/reportes/feed/route.ts`)
- `GET`: últimos 50 reportes para panel admin.
- Incluye activos y expirados recientes para contexto operacional.

### 7.5 `/api/trafico` (`src/app/api/trafico/route.ts`)
- `GET`: tráfico de ambos accesos.
- Delega lógica de caché/fetch/fallback a `src/lib/tomtom.ts`.

### 7.6 `/api/trafico/refresh` (`src/app/api/trafico/refresh/route.ts`)
- `POST`: fuerza refresh de tráfico ignorando TTL.

### 7.7 `/api/mejor-ruta` (`src/app/api/mejor-ruta/route.ts`)
- `GET` con query `tipo=carro|moto`.
- Algoritmo de recomendación:
  - `disponibilidadScore = disponibles / capacidad`
  - `traficoScore = fluido(1.0) | moderado(0.5) | congestionado(0.2)`
  - `scoreFinal = disponibilidadScore*0.6 + traficoScore*0.4`
- Devuelve recomendación + alternativa + explicación textual.

## 8. Librerías internas (`src/lib`)
### 8.1 `src/lib/prisma.ts`
- Patrón singleton de PrismaClient para evitar múltiples instancias en hot reload.

### 8.2 `src/lib/utils.ts`
Funciones puras de dominio:
- Geo: `haversine`.
- Ocupación: `calcularPorcentaje`, `estadoZona`.
- Reportes: `ttlReporte`, `calcularExpiracion`, `reporteExpirado`.
- Tráfico: `estadoTrafico`.
- Presentación temporal: `tiempoRelativo`.

### 8.3 `src/lib/utils-client.ts`
- Réplica client-safe de utilidades usadas en browser para evitar imports server-only.

### 8.4 `src/lib/tomtom.ts`
Servicio de tráfico:
1. Lee caché de DB por `punto`.
2. Si TTL < 60s, responde caché.
3. Si no, consulta TomTom API (si existe `TOMTOM_API_KEY`).
4. Si falla/no key, usa mock y lo persiste.

## 9. Tipos compartidos
Archivo: `src/types/index.ts`
- Contratos de respuesta para todas las APIs consumidas en frontend.
- Tipos de dominio para zonas, tráfico, mejor ruta y reportes.
- Centraliza shape esperada y reduce drift entre backend/frontend.

## 10. Frontend por pantalla (`src/app`)
### 10.1 `src/app/page.tsx`
Home usuario:
- Toggle tipo vehículo.
- Hero de mejor ruta.
- KPIs globales.
- Lista de zonas ordenada por disponibilidad.
- Acción de reportar (FAB).

### 10.2 `src/app/mapa/page.tsx`
Mapa tiempo real:
- Import dinámico de mapa (`ssr:false`).
- Muestra zonas, accesos y ubicación del usuario.
- Integra notificaciones y geofencing.

### 10.3 `src/app/zona/[slug]/page.tsx`
Detalle zona:
- Desglose de ocupación carro/moto.
- Estado de acceso asociado.
- Feed local de reportes recientes.

### 10.4 `src/app/admin/page.tsx`
Dashboard admin:
- Layout desktop 2 columnas.
- KPIs + feed reportes + edición manual de ocupación.
- Botón de refresh de tráfico.

### 10.5 `src/app/layout.tsx` y `src/app/globals.css`
- Metadata global y fuente.
- Paleta institucional + overrides Leaflet.

## 11. Hooks principales (`src/hooks`)
### 11.1 `useParking`
- Hook agregador para home/mapa.
- Polling 30s.
- Fetch concurrente de 3 endpoints core.

### 11.2 `useReporte`
- Crea reportes vía API.
- Maneja estado UI (`enviando/ok/error/rate_limit`).
- Genera `usuarioAnonId` en `localStorage`.

### 11.3 `useAdminDashboard`
- Polling 15s para admin.
- Detecta IDs nuevos en feed para animación.
- Expone acciones de `PATCH` ocupación y refresh tráfico.

### 11.4 `useTracking`
- `watchPosition` continuo.
- Geofencing por zona (80m) y campus (300m).
- Dispara patch +1/-1 por entrada/salida.
- Muestra modal cuando detecta usuario estático en perímetro.

### 11.5 `useNotificaciones`
- Notification API.
- Alertas por cambio de zona recomendada o mejora de tráfico.

## 12. Componentes
### 12.1 Usuario (`src/components/*`)
- `HeroMejorRuta`: bloque principal de recomendación.
- `BarraKPI`: KPIs resumidos.
- `ZonaCard`: tarjeta de zona para listado.
- `BadgeEstado`: visual de estado.
- `BarraProgreso`: progreso ocupación.
- `FABReporte`: UX de reportes.
- `ToastConfirmacion`: feedback temporal.
- `ToggleTipoVehiculo`: switch carro/moto.
- `IndicadorActualizando`: estado de polling.

### 12.2 Mapa
- `MapaCampus`: render y popups sobre Leaflet.
- `ModalDeteccionExterna`: acción de reporte sugerida.

### 12.3 Admin (`src/components/admin/*`)
- `KPIsGlobales`: tablero de métricas y accesos.
- `FeedReportes`: stream operativo.
- `ZonaCardAdmin`: edición puntual de ocupación por zona.

## 13. Flujo de request (ejemplo completo)
Caso: carga de Home (`src/app/page.tsx`)
1. `useParking(tipoVehiculo)` dispara `fetchTodos`.
2. Se solicitan en paralelo:
- `GET /api/zonas`
- `GET /api/trafico`
- `GET /api/mejor-ruta?tipo=...`
3. Backend consulta Prisma y/o servicio `tomtom.ts`.
4. Frontend compone:
- Hero con mejor ruta.
- KPIs con agregados.
- Lista de zonas ordenada por disponibles.
5. Cada 30s repite polling silencioso.

## 14. Convenciones de negocio implementadas
- Estado zona por ocupación:
  - `<70%`: disponible
  - `70-89%`: moderado
  - `90-99%`: crítico
  - `100%`: lleno
- Estado tráfico por ratio `current/freeFlow`:
  - `>=0.70`: fluido
  - `0.50-0.69`: moderado
  - `<0.50`: congestionado
- TTL reportes por tipo:
  - fila_moderada=15m
  - congestion_severa=20m
  - lleno=30m
  - hay_cupos=10m
  - accidente=45m

## 15. Seguridad y límites actuales
Estado actual orientado a demo/prototipo:
- Endpoints admin sin autenticación/autorización robusta.
- Rate limit dependiente de ID cliente manipulable.
- Geofencing cliente puede disparar updates de ocupación sin verificación fuerte.

Recomendación mínima para endurecer:
1. Agregar auth (JWT/session) y RBAC para rutas admin.
2. Rate limit en capa perimetral (IP + fingerprint + token).
3. Registrar auditoría de cambios manuales de ocupación.
4. Mover lógica crítica de ocupación a backend/eventos IoT.

## 16. Observabilidad recomendada
- Logging estructurado por endpoint: latencia, status, payload size.
- Métricas:
  - éxito/error por ruta
  - tiempo promedio de consulta DB
  - uso de mock vs real en tráfico
  - volumen de reportes por tipo/zona
- Alertas:
  - error rate > umbral
  - tráfico en mock sostenido (fallo integración TomTom)

## 17. Evolución propuesta (IoT + Azure)
Resumen de diseño:
- Sensores generan eventos `IN/OUT`.
- Ingesta por IoT Hub/Event Hub.
- Procesamiento con Functions/Container Apps.
- Persistencia operativa en PostgreSQL administrado (Azure Database for PostgreSQL).
- El frontend consume estado agregado, no eventos crudos.

## 18. Mapa de archivos relevantes
- Config y build:
  - `parking-git/package.json`
  - `parking-git/tsconfig.json`
  - `parking-git/next.config.ts`
  - `parking-git/postcss.config.mjs`
  - `parking-git/prisma.config.ts`
- DB:
  - `parking-git/prisma/schema.prisma`
  - `parking-git/prisma/seed.ts`
- Backend:
  - `parking-git/src/app/api/zonas/route.ts`
  - `parking-git/src/app/api/zonas/[id]/route.ts`
  - `parking-git/src/app/api/reportes/route.ts`
  - `parking-git/src/app/api/reportes/feed/route.ts`
  - `parking-git/src/app/api/trafico/route.ts`
  - `parking-git/src/app/api/trafico/refresh/route.ts`
  - `parking-git/src/app/api/mejor-ruta/route.ts`
- Frontend páginas:
  - `parking-git/src/app/page.tsx`
  - `parking-git/src/app/mapa/page.tsx`
  - `parking-git/src/app/zona/[slug]/page.tsx`
  - `parking-git/src/app/admin/page.tsx`
- Lógica reusable:
  - `parking-git/src/hooks/*`
  - `parking-git/src/lib/*`
  - `parking-git/src/types/index.ts`
  - `parking-git/src/components/*`

## 19. Estado actual del proyecto
Estado funcional:
- App usuario y admin operativas en entorno local.
- Persistencia local SQLite.
- Recomendación de ruta y reportes funcionando.

Estado para producción:
- Requiere auth, observabilidad, hardening de reglas de ocupación y migración DB cloud.

