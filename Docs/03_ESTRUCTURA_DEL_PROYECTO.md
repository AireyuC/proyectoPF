# 03. Estructura del Repositorio y Diagnóstico de Archivos

A continuación se detalla la organización actual y la **reestructuración recomendada** del repositorio `proyectoPF` para corregir ubicaciones de archivos, centralizar entornos y ordenar módulos.

---

## 1. Árbol General del Repositorio (Estructura Meta Recomendada)

```text
proyectoPF/
├── .env                       # [REUBICAR/CENTRALIZAR] Variables maestras para docker-compose
├── .env.example               # Plantilla de variables para nuevos desarrolladores
├── .gitignore                 # Exclusiones de Git (incluyendo .env y volúmenes)
├── Docs/                      # Documentación completa del sistema
├── docker-compose.yml         # Orquestador multi-contenedor (Postgres, MinIO, Backend, Frontend)
│
├── phone-fix-backend/         # Aplicación Django (API GraphQL Strawberry)
│   ├── .env                   # Variables específicas de Django (opcional si se heredan del root)
│   ├── Dockerfile             # Contenedor Python 3.11-slim
│   ├── manage.py
│   ├── requirements.txt
│   ├── core/                  # Settings, URLs, Strawberry Schema, JWT Auth
│   ├── staff/                 # RBAC: User, Role, Permission, RolePermission
│   ├── clients/               # Modelos: Client (CI, Teléfono principal, Teléfono ref.)
│   ├── inventory/             # Modelos: Product (Catálogo y flags de stock progresivo)
│   ├── workshop/              # Modelos: Supplier, Device, RepairOrder (Recepción + Taller unificados)
│   ├── sales/                 # Modelos: Sale, SaleItem (Catálogo + Venta manual Admin), CashClose
│   └── common/                # Utilitarios compartidos
│
└── phone-fix-frontend/        # Aplicación React 19 + TypeScript + Vite
    ├── .env.development       # [RENOMBRAR: actualmente .env.developmen]
    ├── .env.production
    ├── Dockerfile             # Contenedor Node 20
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/                   # Feature-Driven Architecture
```

---

## 2. Diagnóstico de Archivos Fuera de Lugar y Deuda Estructural

Tras una auditoría minuciosa de carpetas y archivos, se identificaron los siguientes puntos que requieren ordenamiento al comenzar a codificar:

| Archivo / Carpeta | Situación Actual | Problema Detectado | Acción a Ejecutar |
| :--- | :--- | :--- | :--- |
| **`phone-fix-backend/.env`** | En subcarpeta backend | `docker-compose.yml` en la raíz no tiene un `.env` propio y tiene credenciales de PostgreSQL quemadas en texto plano (`postgres/postgres/postgres`). | **Centralizar:** Crear un `.env` en la raíz (`d:\proyectoPF\.env`) para que Docker Compose inyecte variables tanto a PostgreSQL, MinIO, Django y Vite. |
| **`phone-fix-frontend/.env.developmen`** | Error tipográfico | Le falta la letra **`t`** al final. Vite busca automáticamente `.env.development`, por lo que este archivo es ignorado por defecto. | **Renombrar:** Cambiar a `.env.development`. |
| **`phone-fix-frontend/FileExample.md`** | Archivo residual en raíz | Contiene solo una línea de texto suelta (`"Se puede usar Codex."`). | **Eliminar:** Archivo de prueba innecesario. |
| **`phone-fix-frontend/src/lib/apolloClient.ts`** | IP quemada en código | Tiene fija la IP `http://95.111.245.9:8000/graphql/` ignorando las variables de entorno. | **Reubicar configuración:** Usar `import.meta.env.VITE_API_URL`. |
| **`phone-fix-backend/reception/` vs `workshop/`** | Separación artificial de apps | En Django existen dos apps separadas (`reception` y `workshop`), pero en la realidad del negocio la orden nace en recepción y sigue en taller. Tener dos apps para la misma entidad genera dependencias circulares. | **Unificar dominio:** El modelo `RepairOrder` debe residir en `workshop` (o renombrar a `orders`), mientras que `reception` es simplemente la vista inicial de registro. |
| **Servicio MinIO** | Ausente en Docker Compose | No existe servicio de almacenamiento S3 local para pruebas de fotos de recepción, comprobantes QR y recibos en PDF. | **Incorporar:** Añadir servicio `minio_pfix` con puertos 9000 y 9001 en `docker-compose.yml`. |

---

## 3. Desglose Detallado del Frontend (`phone-fix-frontend/src/`)

```text
src/
├── api/                   # Reservado para hooks de consumo Apollo Client
├── assets/                # Imágenes institucionales y logos
├── components/            # Componentes reutilizables transversales
│   ├── auth/
│   │   ├── ProtectedRoute.tsx   # Requiere sesión iniciada
│   │   ├── AdminOnlyRoute.tsx   # Exclusivo rol Admin
│   │   └── Can.tsx              # [NUEVO] Validador granular de permisos RBAC
│   ├── common/
│   │   ├── Modal.tsx            # Ventana modal genérica
│   │   └── PatternLock.tsx      # Selector táctil interactivo (patrón Android de 9 puntos)
│   └── layout/
│       └── MainLayout.tsx       # Sidebar responsivo y barra superior
│
├── context/
│   └── AuthContext.tsx          # Sesión, Token JWT, Rol y lista de permisos del usuario
│
├── features/              # Módulos por dominio de negocio
│   ├── clients/           # Cartera de clientes y modal de edición
│   ├── inventory/         # Catálogo de repuestos y productos
│   ├── reception/         # Pantalla de nueva orden con patrón y fotos
│   ├── workshop/          # Tablero de reparaciones activas, WhatsApp y modal de piezas
│   ├── sales/             # POS mostrador (con switch de venta libre para Admin) y Cierre de caja
│   └── staff/             # Login con diseño Glassmorphism
│
├── lib/
│   └── apolloClient.ts    # Cliente GraphQL con inyección de Bearer Token
└── utils/
    └── format.ts          # Formateador de moneda (Bs. / BOB) y generador de enlaces WhatsApp
```
