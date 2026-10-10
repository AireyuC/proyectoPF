# 07. Estructura de Permisos (RBAC): De COSMOL-Reportes a PhoneFix

Este documento analiza la estructura del esquema de base de datos y la lógica de control de acceso basada en roles y permisos (**RBAC - Role-Based Access Control**) extraída del proyecto de referencia `COSMOL-Reportes`, y presenta la propuesta de adaptación técnica para el ecosistema de **PhoneFix** (Django 5, PostgreSQL, Strawberry GraphQL y React 19).

---

## 1. Análisis del Modelo en el Proyecto Fuente (`COSMOL-Reportes`)

### A. Estructura SQL de Base de Datos
En `COSMOL-Reportes` (`database/init.sql`), el sistema de permisos está conformado por cuatro tablas relacionales:

```sql
-- 1. Catálogo de Roles
CREATE TABLE IF NOT EXISTS rol (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(200) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Catálogo Maestro de Permisos Granulares
CREATE TABLE IF NOT EXISTS permiso (
    id_permiso SERIAL PRIMARY KEY,
    clave_permiso VARCHAR(100) NOT NULL UNIQUE,  -- Ej: 'usuarios.crear', 'trabajos.concluir'
    nombre_permiso VARCHAR(150) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    modulo VARCHAR(50) NOT NULL,                  -- Agrupador visual (ej. 'Seguridad', 'Operaciones')
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla Intermedia / Tabla Pivote (Relación Muchos a Muchos: Rol <-> Permiso)
CREATE TABLE IF NOT EXISTS rol_permiso (
    id_rol INT NOT NULL REFERENCES rol(id_rol) ON DELETE CASCADE,
    id_permiso INT NOT NULL REFERENCES permiso(id_permiso) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_rol, id_permiso)
);

-- 4. Usuario asociado a un Rol
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario SERIAL PRIMARY KEY,
    username VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    estado SMALLINT NOT NULL DEFAULT 1,
    id_rol INT REFERENCES rol(id_rol) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice de optimización
CREATE INDEX IF NOT EXISTS idx_rol_permiso_id_permiso ON rol_permiso(id_permiso);
```

---

### B. Lógica Operativa Extraída de `COSMOL-Reportes`

1. **Nomenclatura Jerárquica (`clave_permiso`):**
   * Sigue el estándar `modulo.accion` (ejemplo: `usuarios.ver`, `usuarios.crear`, `roles.permisos`, `trabajos.concluir`, `reportes.exportar`).
2. **Agrupación Modular para UI:**
   * El campo `modulo` permite a la interfaz generar una **Matriz de Permisos** agrupada por secciones (`Permiso::allGroupedByModule()`), facilitando asignar permisos mediante checkboxes agrupados.
3. **Carga en el Ciclo de Autenticación:**
   * Al iniciar sesión (`AuthController::login`), se consulta `Permiso::getClavesByRol(id_rol)` y se obtiene un array plano de strings:
     ```php
     $_SESSION['usuario']['permisos'] = ['usuarios.ver', 'reportes.ver', ...];
     ```
4. **Protección en Backend (Middleware):**
   * Enrutador valida los permisos requeridos (`PermissionMiddleware::handle('permission:usuarios.crear')`).
5. **Condicionales de Interfaz (Helper Global):**
   * `hasPermission('clave.accion')` oculta o muestra botones de acción y opciones del sidebar dinámicamente.
6. **Sincronización Transaccional (`syncRolPermisos`):**
   * Para actualizar los permisos de un rol, se eliminan los permisos previos (`DELETE FROM rol_permiso WHERE id_rol = :id_rol`) y se insertan los seleccionados dentro de una transacción ACID (`beginTransaction` / `commit`).

---

## 2. Adaptación de la Estructura para PhoneFix (`proyectoPF`)

En PhoneFix actualmente existe un modelo básico con dos roles rígidos (`ADMIN` y `STAFF`) definidos en un `CharField` con `choices`. La adopción del modelo dinámico de `COSMOL-Reportes` otorgará total flexibilidad para crear roles a medida (ej. *Administrador*, *Técnico Senior*, *Técnico Junior*, *Recepcionista*, *Cajero*).

### A. Modelos en Django ORM (`phone-fix-backend/staff/models.py`)

```python
from django.db import models
from django.contrib.auth.models import AbstractUser

class Role(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Nombre del Rol")
    description = models.CharField(max_length=255, verbose_name="Descripción")
    is_protected = models.BooleanField(default=False, verbose_name="¿Es Rol del Sistema?")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Permission(models.Model):
    code = models.CharField(max_length=100, unique=True, verbose_name="Clave (modulo.accion)")
    name = models.CharField(max_length=150, verbose_name="Nombre legible")
    description = models.CharField(max_length=255, verbose_name="Descripción")
    module = models.CharField(max_length=50, verbose_name="Módulo")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['module', 'code']

    def __str__(self):
        return f"{self.module} - {self.name} ({self.code})"

class RolePermission(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="role_permissions")
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name="role_permissions")
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('role', 'permission')

class User(AbstractUser):
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name="users")

    def has_perm_code(self, perm_code: str) -> bool:
        if self.is_superuser:
            return True
        if not self.role:
            return False
        return self.role.role_permissions.filter(permission__code=perm_code).exists()

    def get_all_permission_codes(self) -> list[str]:
        if self.is_superuser:
            return list(Permission.objects.values_list('code', flat=True))
        if not self.role:
            return []
        return list(
            Permission.objects.filter(role_permissions__role=self.role).values_list('code', flat=True)
        )
```

---

### B. Catálogo Inicial de Permisos para PhoneFix

Homologando la filosofía de `COSMOL-Reportes`, se establece el siguiente catálogo de semillas iniciales para los módulos del negocio:

| Módulo | Clave (`code`) | Nombre | Descripción |
| :--- | :--- | :--- | :--- |
| **Seguridad** | `seguridad.usuarios.ver` | Ver Usuarios | Listar usuarios y personal técnico |
| **Seguridad** | `seguridad.usuarios.gestionar` | Gestionar Usuarios | Crear, editar y dar de baja usuarios |
| **Seguridad** | `seguridad.roles.gestionar` | Gestionar Roles y Permisos | Crear roles y asignar matriz de permisos |
| **Recepción** | `recepcion.ordenes.crear` | Registrar Recepción | Crear nuevas órdenes de servicio y tickets |
| **Recepción** | `recepcion.ordenes.editar` | Modificar Orden Inicial | Cambiar diagnóstico preliminar o cotización |
| **Taller** | `taller.reparaciones.ver` | Ver Taller Activo | Ver lista y estados de equipos en taller |
| **Taller** | `taller.reparaciones.estado` | Cambiar Estado de Reparación | Pasar a Diagnóstico, Proceso o Terminado |
| **Taller** | `taller.repuestos.asignar_interno`| Usar Repuesto Interno | Imputar piezas desde el almacén propio |
| **Taller** | `taller.repuestos.compra_externa`| Registrar Compra Externa | Cargar repuestos comprados en proveedores |
| **Taller** | `taller.reparaciones.entregar` | Entregar Dispositivo | Finalizar y liquidar orden de taller |
| **Taller** | `taller.ordenes.declarar_abandono` | Declarar Abandono (> 3 Meses) | Autorizar absorción de equipo no retirado como activo (Exclusivo ADMIN) |
| **Inventario** | `inventario.productos.ver` | Ver Inventario | Ver catálogo y existencias |
| **Inventario** | `inventario.productos.crear` | Crear Producto | Registrar nuevos repuestos o accesorios |
| **Inventario** | `inventario.stock.ajustar` | Ajustar Stock | Modificar existencias físicas |
| **Inventario** | `inventario.costos.ver` | Ver Costos Privados | Visualizar precio de costo del negocio |
| **Ventas (POS)**| `ventas.pos.vender` | Operar Punto de Venta | Vender accesorios del catálogo oficial |
| **Ventas (POS)**| `ventas.pos.venta_libre` | Venta Libre / Al Aire | Permite escribir productos y precios manuales fuera de catálogo (Exclusivo ADMIN) |
| **Caja** | `caja.movimientos.ver` | Ver Movimientos de Caja | Ver sumatorias de ingresos y egresos |
| **Caja** | `caja.gastos.registrar` | Registrar Gastos | Registrar egresos operativos menores |
| **Caja** | `caja.cierre.realizar` | Realizar Cierre de Caja | Efectuar arqueo y balance diario |
| **Clientes** | `clientes.cartera.ver` | Ver Clientes | Consultar historial y datos de clientes |
| **Clientes** | `clientes.cartera.gestionar` | Gestionar Clientes | Crear, editar y categorizar clientes VIP |

---

### C. Integración en Strawberry GraphQL y JWT (`phone-fix-backend`)

#### 1. Payload de Autenticación con Permisos (`core/auth_graphql.py`)
Al autenticarse, el payload del token y la respuesta GraphQL incluyen la lista plana de permisos del usuario:

```python
import strawberry
from django.conf import settings
import jwt, datetime

@strawberry.type
class AuthPayload:
    token: str
    user_id: int
    role: str | None
    permissions: list[str]

@strawberry.type
class AuthMutation:
    @strawberry.mutation
    def login(self, username: str, password: str) -> AuthPayload | None:
        user = authenticate(username=username, password=password)
        if not user:
            return None
        
        perms = user.get_all_permission_codes()
        role_name = user.role.name if user.role else ("SUPERUSER" if user.is_superuser else None)

        payload = {
            'user_id': user.id,
            'role': role_name,
            'permissions': perms,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
            'iat': datetime.datetime.utcnow()
        }
        token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm='HS256')

        return AuthPayload(
            token=token,
            user_id=user.id,
            role=role_name,
            permissions=perms
        )
```

#### 2. Decorador de Permisos en Resolvers de GraphQL:
```python
def permission_required(perm_code: str):
    def decorator(resolver_fn):
        def wrapper(root, info, *args, **kwargs):
            request = info.context.request
            user = get_user_from_jwt(request)
            if not user or not user.has_perm_code(perm_code):
                raise PermissionError(f"No tienes el permiso requerido: {perm_code}")
            return resolver_fn(root, info, *args, **kwargs)
        return wrapper
    return decorator

# Uso en consultas:
@strawberry.field
@permission_required("inventario.costos.ver")
def get_investment_kpi(self) -> float:
    # Lógica protegida
    ...
```

---

### D. Adaptación al Frontend React 19 (`phone-fix-frontend`)

#### 1. Contexto de Autenticación (`src/context/AuthContext.tsx`)
```typescript
interface UserSession {
    id: number;
    role: string | null;
    permissions: string[];
}

interface AuthContextType {
    user: UserSession | null;
    isAuthenticated: boolean;
    hasPermission: (permCode: string) => boolean;
    login: (token: string, userId: number, role: string, permissions: string[]) => void;
    logout: () => void;
}

// Hook de validación
export const useAuth = () => {
    const context = useContext(AuthContext);
    // ...
    return {
        ...context,
        hasPermission: (permCode: string) => {
            if (context.user?.role === 'Administrador' || context.user?.role === 'SUPERUSER') return true;
            return context.user?.permissions?.includes(permCode) ?? false;
        }
    };
};
```

#### 2. Componente Protector `<Can>` para la Interfaz:
Permite renderizar botones o secciones condicionalmente según los permisos del usuario:

```tsx
// src/components/auth/Can.tsx
export const Can: React.FC<{ permission: string; children: React.ReactNode }> = ({ permission, children }) => {
    const { hasPermission } = useAuth();
    if (!hasPermission(permission)) return null;
    return <>{children}</>;
};

// Ejemplo en el Sidebar o Tablas:
<Can permission="taller.repuestos.compra_externa">
    <button onClick={openExternalBuyModal}>Compra en Calle</button>
</Can>

<Can permission="inventario.costos.ver">
    <span className="text-xs text-slate-500">Costo: Bs. {product.costPrice}</span>
</Can>
```

#### 3. Enrutamiento Protegido Granular:
En lugar de tener solo `AdminOnlyRoute`, se crea un `PermissionRoute`:

```tsx
<Route element={<PermissionRoute permission="caja.cierre.realizar" />}>
    <Route path="caja" element={<CashClosePage />} />
</Route>
```

---

## 3. Resumen Comparativo

| Concepto | Proyecto Fuente (`COSMOL-Reportes`) | Implementación Adaptada para PhoneFix |
| :--- | :--- | :--- |
| **Motor de BD** | PostgreSQL 15 | PostgreSQL 15 (mismo motor) |
| **Esquema Tablas** | `rol`, `permiso`, `rol_permiso`, `usuario` | `Role`, `Permission`, `RolePermission`, `User` (Django ORM) |
| **Convención de Claves** | `modulo.accion` (ej. `trabajos.ver`) | `modulo.recurso.accion` (ej. `taller.reparaciones.estado`) |
| **Almacenamiento de Permisos**| Sesión PHP (`$_SESSION['usuario']['permisos']`)| Payload JWT (`jwt_token`) + Contexto React (`AuthContext`) |
| **Protección Backend** | Middleware PHP (`PermissionMiddleware`) | Decorador de Resolvers Strawberry GraphQL |
| **Protección Frontend** | Helper `hasPermission()` en Blade/PHP | Hook `hasPermission()` y Componente `<Can permission="..." />` |
