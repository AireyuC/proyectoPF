# 05. Roadmap y Plan de Reactivación

Este documento establece la hoja de ruta técnica ordenada por prioridades para retomar el desarrollo del sistema tras 6 meses de inactividad, cerrando la brecha entre el Frontend existente y el Backend pendiente.

---

## 🎯 Plan de Fases

```mermaid
graph LR
    Fase1["Fase 1: Correcciones Inmediatas (Quick Wins)"]
    Fase2["Fase 2: Modelos Django ORM"]
    Fase3["Fase 3: API GraphQL Strawberry"]
    Fase4["Fase 4: Conexión Frontend - Apollo"]
    Fase5["Fase 5: Cierre y Despliegue"]

    Fase1 --> Fase2
    Fase2 --> Fase3
    Fase3 --> Fase4
    Fase4 --> Fase5
```

---

## Fase 1: Correcciones Inmediatas y Limpieza (Quick Wins)
*Duración estimada: 1 hora*

1. **Renombrar archivo de entorno:**
   * Cambiar `phone-fix-frontend/.env.developmen` por `phone-fix-frontend/.env.development`.
2. **Dinamizar URL del Backend en Apollo Client:**
   * En `phone-fix-frontend/src/lib/apolloClient.ts`, cambiar la URI fija por `import.meta.env.VITE_API_URL || 'http://localhost:8000/graphql/'`.
3. **Ajustar Zona Horaria en Django:**
   * En `phone-fix-backend/core/settings.py`, cambiar `TIME_ZONE = "America/Caracas"` a `TIME_ZONE = "America/La_Paz"`.
4. **Verificación de Docker:**
   * Levantar `docker-compose up --build` y corroborar que los 3 contenedores inicien en verde sin conflictos de puertos.

---

## Fase 2: Modelado de Datos en Django ORM
*Duración estimada: 1 a 2 días*

Implementar los modelos en cada una de las aplicaciones del backend respetando la estructura ya tipada en el frontend:

### 1. App `clients` (`clients/models.py`)
```python
class Client(models.Model):
    full_name = models.CharField(max_length=150)
    ci = models.CharField(max_length=30, blank=True, null=True)
    is_vip = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class ClientPhone(models.Model):
    client = models.ForeignKey(Client, related_name='phones', on_delete=models.CASCADE)
    number = models.CharField(max_length=20)
    is_primary = models.BooleanField(default=False)
```

### 2. App `inventory` (`inventory/models.py`)
```python
class Product(models.Model):
    class Category(models.TextChoices):
        REPUESTO = 'REPUESTO', 'Repuesto'
        ACCESORIO = 'ACCESORIO', 'Accesorio'
        HERRAMIENTA = 'HERRAMIENTA', 'Herramienta'
        OTRO = 'OTRO', 'Otro'

    name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.REPUESTO)
    stock = models.IntegerField(default=0)
    min_stock = models.IntegerField(default=2)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2)
    location = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### 3. App `workshop` / `reception` (`workshop/models.py`)
```python
class Device(models.Model):
    brand = models.CharField(max_length=50)
    model = models.CharField(max_length=100)
    color = models.CharField(max_length=50, blank=True, null=True)
    imei = models.CharField(max_length=30, blank=True, null=True)
    passcode = models.CharField(max_length=100, blank=True, null=True) # Patrón serializado o PIN
    physical_condition = models.JSONField(default=list) # ['Pantalla rota', 'Mojado']

class RepairOrder(models.Model):
    class Status(models.TextChoices):
        RECIBIDO = 'RECIBIDO', 'Recibido'
        DIAGNOSTICO = 'DIAGNOSTICO', 'Diagnóstico'
        ESPERA_CLIENTE = 'ESPERA_CLIENTE', 'Espera Cliente'
        EN_PROCESO = 'EN_PROCESO', 'En Proceso'
        TERMINADO = 'TERMINADO', 'Terminado'
        ENTREGADO = 'ENTREGADO', 'Entregado'

    ticket_number = models.CharField(max_length=20, unique=True)
    client = models.ForeignKey('clients.Client', on_delete=models.PROTECT, related_name='repairs')
    device = models.OneToOneField(Device, on_delete=models.CASCADE)
    issue_description = models.TextField()
    technician_notes = models.TextField(blank=True, null=True)
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    deposit = models.DecimalField(max_digits=10, decimal_places=2, default=0) # A cuenta / seña
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.RECIBIDO)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class RepairPartItem(models.Model):
    repair_order = models.ForeignKey(RepairOrder, related_name='parts', on_delete=models.CASCADE)
    source_type = models.CharField(max_length=10, choices=[('INTERNAL', 'Interno'), ('EXTERNAL', 'Externo')])
    product = models.ForeignKey('inventory.Product', null=True, blank=True, on_delete=models.SET_NULL)
    name = models.CharField(max_length=150)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    supplier = models.CharField(max_length=100, blank=True, null=True)
    is_paid = models.BooleanField(default=False)
```

### 4. App `sales` (`sales/models.py`)
```python
class Sale(models.Model):
    user = models.ForeignKey('staff.User', on_delete=models.PROTECT)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey('inventory.Product', on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

class CashClose(models.Model):
    date = models.DateField(auto_now_add=True)
    initial_cash = models.DecimalField(max_digits=10, decimal_places=2)
    sales_total = models.DecimalField(max_digits=10, decimal_places=2)
    repairs_total = models.DecimalField(max_digits=10, decimal_places=2)
    expenses_total = models.DecimalField(max_digits=10, decimal_places=2)
    actual_cash = models.DecimalField(max_digits=10, decimal_places=2)
    difference = models.DecimalField(max_digits=10, decimal_places=2)
    closed_by = models.ForeignKey('staff.User', on_delete=models.PROTECT)
```

---

## Fase 3: Capa GraphQL con Strawberry
*Duración estimada: 2 días*

1. **Definir Types de Strawberry en cada app:**
   * `clients/schema.py`, `inventory/schema.py`, `workshop/schema.py`, `sales/schema.py`.
2. **Definir Queries principales:**
   * `getClients(search: String)`
   * `getProducts(category: String, search: String)`
   * `getRepairOrders(status: String)`
   * `getRepairDetail(id: ID)`
   * `getDailyCashSummary()`
3. **Definir Mutations:**
   * `createClient`, `updateClient`
   * `createProduct`, `updateStock`
   * `createRepairOrder`, `updateRepairStatus`, `addPartToRepair`
   * `checkoutSale`
   * `performCashClose`
4. **Integrar al `schema.py` raíz de `core/`.**

---

## Fase 4: Conexión Frontend con Apollo Client
*Duración estimada: 2 días*

1. **`ClientsPage.tsx`:** Sustituir `MOCK_CLIENTS` por query GraphQL y conectar modal `ClientFormModal` a mutación.
2. **`NewOrderPage.tsx`:** Conectar el botón "Registrar Recepción" a la mutación `createRepairOrder`.
3. **`WorkshopPage.tsx` y `RepairDetailModal.tsx`:**
   * Cargar lista de órdenes activas desde GraphQL.
   * Conectar cambio de estado del `select` a la mutación `updateRepairStatus`.
   * Conectar `AddLineItemModal` a la mutación `addPartToRepair`.
4. **`InventoryPage.tsx`:** Mostrar productos reales de la base de datos y calcular KPIs con datos en vivo.
5. **`PosPage.tsx`:** Descontar stock real al confirmar venta.
6. **`CashClosePage.tsx`:** Obtener las sumatorias reales del día y guardar el arqueo en base de datos.

---

## Fase 5: Hardening y Despliegue
*Duración estimada: 1 día*

1. Configurar un servidor Web de producción (Nginx con Gunicorn para Django y archivos estáticos de Vite optimizados vía `npm run build`).
2. Configurar certificados SSL (Let's Encrypt / Certbot).
3. Configurar copias de seguridad automáticas (`pg_dump`) del volumen `postgres_data`.
