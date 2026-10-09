# 03. Estructura del Repositorio

A continuación se detalla la organización del código fuente y los propósitos de cada módulo dentro de `proyectoPF`.

---

## 1. Árbol General del Repositorio

```text
proyectoPF/
├── .git/                      # Control de versiones Git
├── Docs/                      # Documentación del sistema
├── docker-compose.yml         # Orquestador multi-contenedor
├── phone-fix-backend/         # Aplicación Django (API GraphQL)
└── phone-fix-frontend/        # Aplicación React 19 + TypeScript (SPA)
```

---

## 2. Estructura del Backend (`phone-fix-backend/`)

El backend está construido con una arquitectura modular por aplicaciones de Django:

```text
phone-fix-backend/
├── core/                      # Configuración central del proyecto Django
│   ├── asgi.py                # Entrada ASGI
│   ├── auth_graphql.py        # Mutación de login JWT y extracción de usuario por token
│   ├── schema.py              # Esquema raíz Strawberry GraphQL (Query y Mutation)
│   ├── settings.py            # Configuración general (Apps, DB, CORS, Timezone, Auth)
│   ├── urls.py                # Enrutador principal (/admin/ y /graphql/)
│   └── wsgi.py                # Entrada WSGI
│
├── staff/                     # Gestión de usuarios y personal técnico
│   ├── models.py              # Modelo custom 'User' (Roles: ADMIN, STAFF)
│   ├── admin.py               # Registro de usuarios en Django Admin
│   └── migrations/            # Migración inicial (0001_initial.py)
│
├── clients/                   # [Scaffold] Cartera de clientes y contactos
│   ├── models.py              # Pendiente de implementar
│   └── apps.py
│
├── reception/                 # [Scaffold] Ingreso de equipos y órdenes iniciales
│   ├── models.py              # Pendiente de implementar
│   └── apps.py
│
├── workshop/                  # [Scaffold] Órdenes activas en taller y piezas
│   ├── models.py              # Pendiente de implementar
│   └── apps.py
│
├── inventory/                 # [Scaffold] Catálogo de repuestos y accesorios
│   ├── models.py              # Pendiente de implementar
│   └── apps.py
│
├── sales/                     # [Scaffold] Ventas mostrador y arqueos de caja
│   ├── models.py              # Pendiente de implementar
│   └── apps.py
│
├── common/                    # [Scaffold] Modelos base o utilitarios compartidos
│   ├── models.py              # Pendiente de implementar
│   └── apps.py
│
├── .env                       # Variables de entorno (DB, Secret Key, CORS)
├── Dockerfile                 # Definición del contenedor Python 3.11-slim
├── manage.py                  # CLI de administración de Django
└── requirements.txt           # Dependencias Python
```

---

## 3. Estructura del Frontend (`phone-fix-frontend/`)

El frontend está estructurado mediante un patrón **Feature-Driven Architecture** (organización por funcionalidades de negocio):

```text
phone-fix-frontend/
├── public/                    # Activos estáticos públicos
├── src/
│   ├── api/                   # Servicios o endpoints auxiliares (actualmente reservado)
│   ├── assets/                # Imágenes y SVGs del proyecto
│   │
│   ├── components/            # Componentes transversales reutilizables
│   │   ├── auth/
│   │   │   ├── AdminOnlyRoute.tsx   # Guardia de ruta exclusivo para administradores
│   │   │   └── ProtectedRoute.tsx   # Guardia de ruta para usuarios logueados
│   │   ├── common/
│   │   │   ├── Modal.tsx            # Modal base genérico con animaciones
│   │   │   └── PatternLock.tsx      # Bloqueador táctil interactivo (patrón Android de 9 nodos)
│   │   └── layout/
│   │       └── MainLayout.tsx       # Sidebar colapsable, navegación y cabecera de usuario
│   │
│   ├── context/
│   │   └── AuthContext.tsx          # Estado global de sesión, token JWT y rol del usuario
│   │
│   ├── features/              # Módulos de negocio (Feature-based)
│   │   ├── clients/           # Cartera de clientes
│   │   │   ├── components/
│   │   │   │   └── ClientFormModal.tsx  # Formulario de alta/edición de cliente
│   │   │   ├── pages/
│   │   │   │   └── ClientsPage.tsx      # Vista general con filtros y badges VIP
│   │   │   └── types/
│   │   │       └── index.ts             # Tipos: Client, teléfonos, métricas
│   │   │
│   │   ├── inventory/         # Repuestos y productos
│   │   │   ├── components/
│   │   │   │   └── ProductFormModal.tsx # Formulario de productos y stock mínimo
│   │   │   ├── pages/
│   │   │   │   └── InventoryPage.tsx    # Dashboard con KPIs y catálogo
│   │   │   └── types/
│   │   │       └── index.ts             # Tipos: Product, ProductCategory, márgenes
│   │   │
│   │   ├── reception/         # Recepción de dispositivos
│   │   │   └── pages/
│   │   │       └── NewOrderPage.tsx     # Formulario de ingreso de ticket y equipo
│   │   │
│   │   ├── sales/             # Punto de venta y finanzas
│   │   │   └── pages/
│   │   │       ├── PosPage.tsx          # Carrito de compra y cobro rápido
│   │   │       └── CashClosePage.tsx    # Arqueo de caja y balance del día
│   │   │
│   │   ├── staff/             # Autenticación y acceso
│   │   │   └── pages/
│   │   │       └── LoginPage.tsx        # Pantalla de inicio de sesión con Glassmorphism
│   │   │
│   │   └── workshop/          # Taller y servicio técnico
│   │       ├── components/
│   │       │   ├── AddLineItemModal.tsx   # Asignación de repuesto interno vs compra externa
│   │       │   └── RepairDetailModal.tsx  # Ficha técnica, estados y WhatsApp
│   │       ├── pages/
│   │       │   └── WorkshopPage.tsx       # Tablero de reparaciones en curso
│   │       └── types/
│   │           └── index.ts               # Tipos: RepairOrder, RepairStatus, Device
│   │
│   ├── lib/
│   │   └── apolloClient.ts    # Configuración de cliente Apollo, link HTTP y headers JWT
│   │
│   ├── utils/
│   │   └── format.ts          # Formateador de moneda (BOB) y generador de enlaces WhatsApp
│   │
│   ├── App.tsx                # Rutas y jerarquía de componentes de la aplicación
│   ├── main.tsx               # Punto de entrada de React 19 y Provider Apollo
│   └── index.css              # Estilos globales y directivas de Tailwind CSS
│
├── .env.developmen            # Configuración para entorno de desarrollo local
├── .env.production            # Configuración para entorno de producción
├── Dockerfile                 # Contenedor de Node 20 para desarrollo Vite
├── package.json               # Dependencias del frontend
├── postcss.config.js          # Procesador PostCSS
├── tailwind.config.js         # Configuración de estilos Tailwind
└── vite.config.ts             # Configuración del servidor y plugins de Vite
```
