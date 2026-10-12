# 06. Guía de Ejecución y Despliegue

Instrucciones para levantar el proyecto localmente mediante Docker Compose (con PostgreSQL, MinIO, Django y Vite) y notas sobre la infraestructura.

---

## 1. Requisitos Previos

* **Docker Desktop** (con Docker Compose v2 instalado y en ejecución).
* O alternativamente para ejecución nativa en la máquina host:
  * **Python** 3.11 o superior.
  * **Node.js** v20 o superior y **npm**.
  * **PostgreSQL** 15 instalado localmente.

---

## 2. Ejecución con Docker Compose (Recomendado)

Todo el ecosistema se gestiona a través del archivo centralizado [`.env`](file:///d:/proyectoPF/.env) en la raíz del proyecto.

### A. Iniciar y Reconstruir los Contenedores
Para compilar y aplicar cualquier cambio en caliente de forma limpia y garantizada en Docker:

```bash
# Opción recomendada directa:
docker compose up -d --build

# O en caso de requerir un reinicio completamente limpio de red y procesos:
docker compose down
docker compose up -d --build
```

Esto levantará automáticamente los 4 servicios interconectados:
1. `db_pfix`: Servidor PostgreSQL 15 en el puerto `5432`.
2. `minio_pfix`: Servidor MinIO Object Storage (API S3 en `:9000` y Consola Web en `:9001`).
3. `backend_pfix`: Servidor Django 5 + Strawberry GraphQL en el puerto `8000`.
4. `frontend_pfix`: Servidor de desarrollo Vite + React 19 en el puerto `5173`.

---

### B. Credenciales de Acceso y Usuario Administrador

#### 1. Credencial de Desarrollo Preconfigurada:
* **Usuario:** `aireyu`
* **Contraseña:** `admin123`
* **Rol:** `ADMIN` (acceso irrestricto a taller, inventario, ventas, libro contable y auditoría).

#### 2. Crear Superusuario Adicional o Alternativo:
Si se requiere generar un nuevo administrador desde la consola Docker:

```bash
# Ejecución directa en el contenedor backend_pfix:
docker compose exec backend_pfix python manage.py createsuperuser
```

Y para asignarle rol administrativo en el modelo de negocio:
```bash
docker compose exec backend_pfix python manage.py shell
```
```python
from staff.models import User
u = User.objects.get(username="tu_nuevo_usuario")
u.role = User.Roles.ADMIN
u.save()
exit()
```

#### 3. Ejecutar Migraciones de Base de Datos:
Cuando se introduzcan nuevos campos o modelos Django:
```bash
docker compose exec backend_pfix python manage.py migrate
```

---

### C. URLs de Acceso Local
* **Aplicación Web (Frontend):** [http://localhost:5173](http://localhost:5173)
* **GraphQL Playground / Strawberry:** [http://localhost:8000/graphql/](http://localhost:8000/graphql/)
* **Django Admin Panel:** [http://localhost:8000/admin/](http://localhost:8000/admin/)
* **MinIO Web Console (S3 Storage):** [http://localhost:9001](http://localhost:9001)  
  * *Usuario:* `admin`
  * *Password:* `minioadmin123`

---

## 3. Configuración Maestra de Variables de Entorno (`.env`)

El archivo `.env` en la raíz del repositorio gobierna todos los contenedores:

```properties
# Django Backend Core
DEBUG=True
SECRET_KEY=django-insecure-super-secret-key-for-dev-only
ALLOWED_HOSTS=*
TIME_ZONE=America/La_Paz

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://95.111.245.9:5173

# Base de Datos PostgreSQL
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db_pfix
DB_PORT=5432

# MinIO Object Storage
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=minioadmin123
MINIO_ENDPOINT=http://minio_pfix:9000
MINIO_PUBLIC_ENDPOINT=http://localhost:9000
MINIO_BUCKET_NAME=phonefix-media

# Frontend Vite
VITE_API_URL=http://localhost:8000/graphql/
VITE_MINIO_URL=http://localhost:9000
```

---

## 4. Notas sobre el Servidor VPS y Producción

* **IP Detectada:** En el código previo se encontraba configurada la IP `95.111.245.9`.
* Para producción real:
  1. Utilizar un proxy inverso con Nginx para gestionar certificados SSL Let's Encrypt (HTTPS / WSS).
  2. Cerrar el puerto `5432` de PostgreSQL y `9001` de MinIO a la red pública (acceder solo mediante red interna de Docker).
