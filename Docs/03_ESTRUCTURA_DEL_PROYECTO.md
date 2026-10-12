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

## 2. Diagnóstico de Archivos y Deuda Estructural (100% RESUELTO)

Todas las desviaciones y deudas estructurales detectadas en la auditoría inicial han sido **completamente resueltas y normalizadas**:

| Archivo / Carpeta | Situación Original | Acción Ejecutada | Estado |
| :--- | :--- | :--- | :---: |
| **`.env` Maestro** | Fragmentado en subcarpetas | Centralizado en la raíz (`d:\proyectoPF\.env`) orquestando PostgreSQL, MinIO, Django y Vite. | ✅ **RESUELTO** |
| **`phone-fix-frontend/.env.development`** | Nombre incompleto `.env.developmen` | Renombrado a `.env.development` para carga automática en Vite. | ✅ **RESUELTO** |
| **`FileExample.md`** | Archivo residual en raíz frontend | Eliminado para mantener el repositorio limpio. | ✅ **RESUELTO** |
| **`apolloClient.ts`** | IP quemada en código | Refactorizado para consumir `import.meta.env.VITE_API_URL` de forma reactiva y dinámica. | ✅ **RESUELTO** |
| **Dominio de Reparaciones** | Separación en apps redundantes | Centralizado y cohesionado en la app `workshop` (con `RepairOrder`, `Device`, `Supplier` y `RepairPartItem`). | ✅ **RESUELTO** |
| **Servicio MinIO S3** | Ausente en Docker Compose | Contenedor `minio_pfix` integrado (puertos 9000 API y 9001 Consola Web) con bucket `phonefix-media`. | ✅ **RESUELTO** |

---

## 3. Desglose Detallado del Frontend (`phone-fix-frontend/src/`)

```text
src/
├── api/                   # Consultas y Mutaciones GraphQL centralizadas (graphql.ts)
├── assets/                # Imágenes institucionales, logos SVG y tipografías
├── components/            # Componentes reutilizables transversales
│   ├── auth/
│   │   ├── ProtectedRoute.tsx   # Guard de sesión activa
│   │   ├── AdminOnlyRoute.tsx   # Exclusivo rol Admin
│   │   └── Can.tsx              # Validador granular de permisos RBAC
│   ├── common/
│   │   ├── Modal.tsx            # Ventana modal genérica
│   │   └── PatternLock.tsx      # Selector táctil interactivo (patrón Android de 9 puntos)
│   └── layout/
│       └── MainLayout.tsx       # Sidebar responsivo Cyber-Clean y header con branding oficial
│
├── context/
│   └── AuthContext.tsx          # Sesión, Token JWT, Rol y permisos del usuario activo
│
├── features/              # Arquitectura modular por dominio de negocio
│   ├── clients/           # Cartera de clientes, contador de visitas por C.I. y badges de recurrencia
│   │   └── pages/ClientsPage.tsx
│   ├── inventory/         # Catálogo de repuestos/accesorios y control de stock progresivo
│   │   └── pages/InventoryPage.tsx
│   ├── reception/         # Recepción de equipos con autocompletado por C.I. y presets de marcas
│   │   └── pages/NewOrderPage.tsx
│   ├── workshop/          # Taller activo en 4 fases operativas, proveedores y auditoría de presupuesto
│   │   ├── pages/
│   │   │   ├── WorkshopPage.tsx       # Tablero principal de reparaciones (ancho completo sin saltos)
│   │   │   └── SuppliersPage.tsx      # Directorio de casetas externas y proveedores
│   │   └── components/
│   │       ├── WorkshopTableView.tsx  # Vista tabular con 4 fases y estados cromáticos
│   │       ├── RepairDetailModal.tsx  # Modal 4 pestañas (Diagnóstico, Reparación, Liquidación, Historial)
│   │       ├── AddLineItemModal.tsx   # Imputación de repuestos con tope y canal Efectivo/QR
│   │       └── SupplierModal.tsx      # Alta y edición rápida de casetas comerciales
│   ├── sales/             # POS mostrador, Arqueo de caja y Libro Contable Bicanal
│   │   └── pages/
│   │       ├── PosPage.tsx              # Punto de venta y venta libre fuera de catálogo
│   │       ├── CashClosePage.tsx        # Cierre diario de caja física vs digital
│   │       └── AccountingLedgerPage.tsx # Libro contable general con 5 KPIs y split Efectivo/QR
│   └── staff/             # Pantalla de Login Glassmorphism
│       └── pages/LoginPage.tsx
│
├── lib/
│   └── apolloClient.ts    # Apollo Client con interceptor Bearer JWT
└── utils/
    └── format.ts          # Formateador de moneda boliviana (Bs. / BOB) y enlaces WhatsApp
```
