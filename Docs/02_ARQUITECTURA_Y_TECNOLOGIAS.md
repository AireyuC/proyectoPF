# 02. Arquitectura y Tecnologías

## 1. Diagrama de Arquitectura del Sistema

El sistema implementa una arquitectura desacoplada **Cliente-Servidor (SPA + API GraphQL + Almacenamiento S3 MinIO)** completamente contenerizada en Docker:

```mermaid
graph TB
    subgraph Browser["Navegador del Usuario"]
        SPA["React 19 SPA (Vite)"]
        Apollo["Apollo Client 4 (GraphQL Link + JWT Header)"]
        LocalStorage[("LocalStorage: jwt_token, user_role, user_id")]
        SPA <--> Apollo
        SPA <--> LocalStorage
    end

    subgraph DockerNetwork["Red Docker: docker-compose"]
        subgraph FrontendContainer["Contenedor: frontend_pfix"]
            ViteDevServer["Node 20 Alpine (Vite Server :5173)"]
        end

        subgraph BackendContainer["Contenedor: backend_pfix"]
            DjangoApp["Python 3.11 / Django 5.0 (:8000)"]
            Strawberry["Strawberry GraphQL Django Engine"]
            JWTAuth["Autenticación PyJWT"]
            DjangoORM["Django ORM"]
            
            DjangoApp --> Strawberry
            Strawberry --> JWTAuth
            Strawberry --> DjangoORM
        end

        subgraph DatabaseContainer["Contenedor: db_pfix"]
            Postgres["PostgreSQL 15 Alpine (:5432)"]
            PGData[("Volumen postgres_data")]
            Postgres --- PGData
        end

        subgraph StorageContainer["Contenedor: minio_pfix"]
            MinIO["MinIO Object Storage S3 (:9000 API / :9001 Web)"]
            MinIOData[("Volumen minio_data")]
            MinIO --- MinIOData
        end
    end

    SPA -- "HTTP / GraphQL Queries & Mutations" --> DjangoApp
    DjangoORM -- "Conexión TCP / psycopg2" --> Postgres
    DjangoApp -- "S3 SDK (boto3) Presigned URLs" --> MinIO
    SPA -- "Subida directa de fotos y recibos" --> MinIO
```

---

## 2. Stack Tecnológico

### Frontend
| Componente | Tecnología | Versión / Detalle | Razón de Uso |
| :--- | :--- | :--- | :--- |
| **Framework Base** | React | `^19.2.0` | React moderno con concurrencia, Hooks y alto rendimiento. |
| **Lenguaje** | TypeScript | `~5.9.3` | Tipado estático para modelos de cliente, taller, inventario y ventas. |
| **Bundler** | Vite | `^7.3.1` | Compilación ultrarrápida y Hot Module Replacement (HMR). |
| **Estilos** | Tailwind CSS | `^4.1.18` (vía `@tailwindcss/postcss`) | Sistema de diseño atómico, minimalista y responsivo. |
| **Enrutamiento** | React Router DOM | `^7.13.0` | Gestión de rutas SPA, layouts anidados y guards de protección. |
| **Cliente API** | Apollo Client | `^4.1.4` (y `graphql ^16.12.0`) | Consumo eficiente de esquemas GraphQL con inyección de JWT por headers. |
| **Iconografía** | Lucide React | `^0.564.0` | Set de iconos vectoriales modernos y consistentes. |

---

### Backend y Almacenamiento
| Componente | Tecnología | Versión / Detalle | Razón de Uso |
| :--- | :--- | :--- | :--- |
| **Lenguaje** | Python | `3.11-slim` | Rendimiento óptimo y soporte nativo tipado moderno. |
| **Framework Web** | Django | `>=5.0, <6.0` | ORM robusto, sistema de migraciones, panel administrativo y seguridad. |
| **Motor GraphQL** | Strawberry GraphQL | `strawberry-graphql-django` | GraphQL moderno basado en `dataclasses` y type annotations de Python. |
| **Motor de BD** | PostgreSQL | `15-alpine` | Base de datos relacional ACID para transaccionalidad de caja y stock. |
| **Driver de BD** | `psycopg2-binary` | Driver nativo para PostgreSQL. | Conexión directa Django ORM - PostgreSQL. |
| **Almacenamiento de Objetos** | **MinIO** | `minio/minio` (API S3 compatible) | Almacenamiento escalable de fotos de recepción, comprobantes QR y facturas/recibos en PDF. |
| **SDK Almacenamiento** | `boto3` / `django-storages` | Cliente oficial S3 para Python | Generación de URLs prefirmadas seguras y manipulación de buckets. |
| **Autenticación** | `PyJWT` | `>=2.8.0` | Generación y validación de tokens JWT sin estado. |
| **Variables de Entorno**| `django-environ` | Lectura de `.env` estructurado. | Configuración 12-Factor App. |
| **CORS** | `django-cors-headers` | Control de orígenes cruzados. | Permite peticiones desde el frontend local y remoto. |

---

## 3. Seguridad y Flujo de Autenticación

El flujo de autenticación es completamente Stateless basado en **JSON Web Tokens (JWT)**:

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant Frontend as Frontend (LoginPage)
    participant AuthContext as AuthContext (React)
    participant GraphQL as Django (Strawberry GraphQL)
    participant DB as PostgreSQL (staff_user)

    Usuario->>Frontend: Ingresa username y password
    Frontend->>GraphQL: Mutation login(username, password)
    GraphQL->>DB: authenticate(username, password)
    alt Credenciales Válidas
        DB-->>GraphQL: Retorna instancia User
        GraphQL->>GraphQL: Genera JWT (user_id, role, permissions, exp=7 días)
        GraphQL-->>Frontend: Retorna AuthPayload { token, userId, role, permissions }
        Frontend->>AuthContext: login(token, userId, role, permissions)
        AuthContext->>AuthContext: Guarda en localStorage (jwt_token, user_role, user_id, user_permissions)
        Frontend->>Usuario: Redirige a '/' (Dashboard)
    else Credenciales Inválidas
        GraphQL-->>Frontend: Retorna null / Error
        Frontend->>Usuario: Muestra "Credenciales incorrectas"
    end
```

### Inyección de Token en Peticiones Posteriores
* En cada petición que realiza `Apollo Client` (`src/lib/apolloClient.ts`), el enlace `authLink` intercepta los headers:
  ```typescript
  const token = localStorage.getItem('jwt_token');
  headers: {
    ...headers,
    authorization: token ? `Bearer ${token}` : "",
  }
  ```
* En el backend (`core/auth_graphql.py`), la función utilitaria `get_user_from_jwt(request)` decodifica el token con la clave secreta `JWT_SECRET_KEY` y obtiene el usuario autenticado desde `staff.models.User`.

---

## 4. Red y Configuración de Docker

El archivo `docker-compose.yml` orquesta 4 servicios interconectados en la misma red:

```yaml
services:
  db_pfix:         # Puerto 5432:5432 - Persistencia con volumen 'postgres_data'
  minio_pfix:      # Puerto 9000 (API S3) y 9001 (Consola Web) - Volumen 'minio_data'
  backend_pfix:    # Puerto 8000:8000 - Montaje de volumen local para hot-reload
  frontend_pfix:   # Puerto 5173:5173 - Servidor Vite con host 0.0.0.0
```

### Puertos Expuestos
* **8000:** Django Backend API (`/graphql/` y `/admin/`).
* **5173:** Vite Frontend React (`http://localhost:5173`).
* **5432:** PostgreSQL Database.
* **9000:** MinIO S3 API Endpoint.
* **9001:** MinIO Web Console Dashboard.
