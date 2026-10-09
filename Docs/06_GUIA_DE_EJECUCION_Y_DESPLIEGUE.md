# 06. Guía de Ejecución y Despliegue

Instrucciones para levantar el proyecto localmente y notas sobre la infraestructura del servidor VPS.

---

## 1. Requisitos Previos

* **Docker Desktop** (con Docker Compose v2 instalado y en ejecución).
* O alternativamente para ejecución nativa en la máquina host:
  * **Python** 3.11 o superior.
  * **Node.js** v20 o superior y **npm**.
  * **PostgreSQL** 15 instalado localmente.

---

## 2. Ejecución con Docker Compose (Recomendado)

La forma más rápida y confiable de levantar todo el ecosistema (Base de datos, Backend y Frontend):

### A. Iniciar los contenedores
Desde la raíz del repositorio (`d:\proyectoPF`):

```bash
docker-compose up --build
```

Esto ejecutará automáticamente:
1. `db_pfix`: Servidor PostgreSQL 15 en el puerto `5432`.
2. `backend_pfix`: Ejecutará `python manage.py makemigrations && python manage.py migrate` y arrancará el servidor Django en el puerto `8000`.
3. `frontend_pfix`: Instalará dependencias y levantará el dev server de Vite en el puerto `5173`.

### B. Crear el Usuario Administrador Inicial
Para poder iniciar sesión en la aplicación y en el panel de Django Admin:

1. Abrir una nueva terminal.
2. Identificar el nombre del contenedor de backend (habitualmente `proyectopf-backend_pfix-1` o revisar con `docker ps`).
3. Ejecutar:
   ```bash
   docker exec -it proyectopf-backend_pfix-1 python manage.py createsuperuser
   ```
4. Ingresar username, email y contraseña.
5. Asignar el rol `ADMIN` ingresando a la shell de Django o al panel:
   ```bash
   docker exec -it proyectopf-backend_pfix-1 python manage.py shell
   ```
   ```python
   from staff.models import User
   u = User.objects.get(username="tu_usuario")
   u.role = User.Roles.ADMIN
   u.save()
   exit()
   ```

### C. URLs de Acceso Local
* **Aplicación Web (Frontend):** [http://localhost:5173](http://localhost:5173)
* **GraphQL Playground / Strawberry:** [http://localhost:8000/graphql/](http://localhost:8000/graphql/)
* **Django Admin Panel:** [http://localhost:8000/admin/](http://localhost:8000/admin/)

---

## 3. Ejecución Manual en Entorno Local (Sin Docker)

Si prefieres ejecutar los servicios directamente en tu sistema operativo:

### A. Base de Datos
Tener una instancia de PostgreSQL corriendo con base de datos `postgres`, usuario `postgres` y contraseña `postgres` en el puerto `5432`.

### B. Backend (`phone-fix-backend`)
```bash
cd phone-fix-backend
python -m venv venv
# En Windows Powershell:
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### C. Frontend (`phone-fix-frontend`)
```bash
cd phone-fix-frontend
npm install
npm run dev
```

---

## 4. Configuración de Variables de Entorno

### Backend (`phone-fix-backend/.env`)
```properties
DEBUG=True
SECRET_KEY=django-insecure-super-secret-key-for-dev-only
ALLOWED_HOSTS=*

# CORS para desarrollo local y VPS:
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://95.111.245.9:5173

# Base de datos (en docker el host es 'db_pfix', en localhost es 'localhost' o '127.0.0.1')
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db_pfix
DB_PORT=5432
```

### Frontend (`phone-fix-frontend/.env.development`)
```properties
VITE_API_URL=http://localhost:8000/graphql/
```

### Frontend (`phone-fix-frontend/.env.production`)
```properties
VITE_API_URL=http://95.111.245.9:8000/graphql/
```

---

## 5. Notas sobre el VPS y Producción

En el historial del repositorio y en las configuraciones existen referencias al servidor VPS con IP **`95.111.245.9`**:
* Dicha IP fue configurada en los orígenes permitidos de CORS en Django (`settings.py` y `.env`).
* Para producción real se recomienda:
  1. Asociar un dominio o subdominio DNS (ej. `app.phonefix.com` y `api.phonefix.com`).
  2. Implementar un servidor Nginx como reverse proxy para gestionar certificados SSL vía Certbot (HTTPS / WSS).
  3. No exponer el puerto de PostgreSQL `5432` a la red pública en el archivo `docker-compose.yml` en producción.
