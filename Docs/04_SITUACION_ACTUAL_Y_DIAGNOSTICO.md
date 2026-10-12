# 04. Situación Actual y Diagnóstico del Código

Este documento resume la radiografía técnica del sistema **PhoneFix**, el estado de convergencia entre capas y el cierre total de las deudas técnicas identificadas durante la reactivación del proyecto.

---

## 1. Resumen de Estado Actual (100% Integrado)

| Componente | Nivel de Avance | Estado Real |
| :--- | :---: | :--- |
| **Infraestructura Docker** | 100% | 4 Contenedores operativos (`backend_pfix`, `frontend_pfix`, `db_pfix`, `minio_pfix`). |
| **Autenticación (JWT + GraphQL)** | 100% | Login funcional entre React y Django Strawberry GraphQL con RBAC. |
| **UI / UX (Frontend)** | 100% | Pantallas Cyber-Clean, modales contextuales, navegación por fases y vista extendida. |
| **Modelos de Datos (Backend)** | 100% | Modelos completos en PostgreSQL para `clients`, `workshop`, `inventory`, `sales` y `staff`. |
| **API GraphQL (Backend)** | 100% | Queries y Mutations completas con resolvers robustos, atomicidad y validaciones. |
| **Conexión Frontend - Backend** | 100% | **Cero datos Mock.** Todas las vistas operan con Apollo Client (`useQuery`, `useMutation`). |
| **Almacenamiento S3 (MinIO)** | 100% | Generación de facturas PDF con ReportLab y fotos de recepción almacenadas en MinIO. |

---

## 2. Resolución del Desfase Arquitectónico ("The Gap Resolved")

El desfase histórico donde el Frontend utilizaba datos simulados (`MOCK_*`) mientras el Backend carecía de modelos ha sido **completamente superado**:

```mermaid
graph TD
    subgraph Frontend Real (React 19 + Apollo Client)
        F1[LoginPage -> CONECTADO VÍA GRAPHQL]
        F2[NewOrderPage -> Mutaciones createClient y createRepairOrder]
        F3[WorkshopPage -> Query repairOrders en 4 Fases Operativas]
        F4[InventoryPage -> Query products y gestión de catálogo]
        F5[PosPage -> Mutación createSale con soporte bicanal y venta libre]
        F6[CashClosePage -> Query drawerSummary y mutación createCashClose]
        F7[ClientsPage -> Query clients con contador y detección de recurrencia]
        F8[AccountingLedgerPage -> Query accountingLedger inmutable y exportación CSV]
    end

    subgraph Backend Operativo (Django 5 + Strawberry)
        B1[staff.User y Permisos RBAC]
        B2[clients.Client con unicidad por C.I.]
        B3[workshop.RepairOrder y workshop.RepairPartItem]
        B4[workshop.Supplier y Directorio de Casetas]
        B5[inventory.Product con control progresivo]
        B6[sales.Sale y sales.SaleItem]
        B7[sales.CashClose y Libro Contable General]
    end

    F1 <== "Autenticación JWT" ==> B1
    F2 <== "Recepción & Clientes" ==> B2
    F2 <== "Registro de Orden" ==> B3
    F3 <== "Gestión de Taller & Piezas" ==> B3
    F3 <== "Proveedores Externos" ==> B4
    F4 <== "Inventario de Almacén" ==> B5
    F5 <== "Venta Mostrador POS" ==> B6
    F6 <== "Arqueo de Caja Bicanal" ==> B7
    F7 <== "Directorio de Clientes" ==> B2
    F8 <== "Auditoría Financiera Inmutable" ==> B7
```

---

## 3. Radiografía por Capas

### A. Capa Backend (`phone-fix-backend`)
* **Estado:** Totalmente funcional y verificado.
* **Módulos implementados:**
  1. `clients`: Modelo `Client`, mutación `create_client` (con `get_or_create` por C.I. o celular para evitar duplicados), campos `repairs_count` e `is_recurrent`.
  2. `workshop`: Modelos `Device`, `RepairOrder`, `RepairPartItem` y `Supplier`. Soporte para 4 fases de taller, techo presupuestario (`cost_cash_out`), selector de canal de pago (`payment_method` en piezas y `deposit_refund_method` en órdenes), abandono (> 90 días) y facturación PDF en MinIO.
  3. `inventory`: Modelo `Product` con categorías (`REPUESTO`, `ACCESORIO`, etc.), control progresivo de stock (`is_stock_managed`) y catálogo maestro de marcas y modelos.
  4. `sales`: Modelo `Sale`, `SaleItem`, `CashClose` y resolver de `accounting_ledger` inmutable que consolida ingresos y egresos separando Efectivo y QR.
  5. `staff`: Sistema de usuarios extendiendo `AbstractUser` con roles (`ADMIN`, `STAFF`) y permisos granulares de seguridad RBAC.

---

### B. Capa Frontend (`phone-fix-frontend`)
* **Estado:** 100% Reactivo y conectado a la API GraphQL.
* **Componentes clave integrados:**
  1. `NewOrderPage`: Recepción con autocompletado de clientes recurrentes al tipear C.I., patrón visual de 9 puntos (`PatternLock`), presets de marcas y cotización inmediata o diferida.
  2. `WorkshopPage`: Dividida en **4 fases operativas**:
     - *1. En Diagnóstico / Revisión*
     - *2. En Reparación / Mesa de Trabajo*
     - *3. Listos para Retiro / Por Entregar*
     - *4. Entregados & Historial*
  3. `RepairDetailModal` & `AddLineItemModal`: Gestión de repuestos con control de techo presupuestario (`Budget Cap`), selector de canal de egreso (`Efectivo` vs `QR`), generación de PDF y liquidación final.
  4. `AccountingLedgerPage`: Libro contable inmutable con 5 tarjetas KPI bicanal, tabla de 11 columnas con egresos discriminados y exportación a Excel en formato UTF-8 BOM.
  5. `ClientsPage`: Directorio de clientes con contador correlativo de visitas (`🔄 X órdenes`) y badge dorado `⭐ Cliente Recurrente`.

---

## 4. Deudas Técnicas Resueltas

1. **Configuración de Variables de Entorno:**
   * ✅ **RESUELTO:** Creación de `.env` maestro en la raíz y `.env.development` en el frontend apuntando a `http://localhost:8000/graphql`.
2. **Infraestructura de Almacenamiento S3 (MinIO):**
   * ✅ **RESUELTO:** Contenedor `minio_pfix` integrado a la red Docker con alias `minio` para compatibilidad estricta con `botocore`.
3. **Zona Horaria de Bolivia:**
   * ✅ **RESUELTO:** Configurado `TIME_ZONE = "America/La_Paz"` en `core/settings.py`.
4. **Eliminación de Mocks en Frontend:**
   * ✅ **RESUELTO:** Todos los archivos de mocks locales fueron reemplazados por llamadas nativas de Apollo Client conectadas a PostgreSQL.
5. **Doble Cotización y Descuadre de Presupuesto:**
   * ✅ **RESUELTO:** Separación estricta entre `technician_notes` y `authorized_work`, más barra de auditoría de presupuesto máximo aprobado.
6. **Descuadre de Caja Chica por Pagos QR:**
   * ✅ **RESUELTO:** Discriminación obligatoria del canal de egreso (`EFECTIVO` vs `QR`) en repuestos y devoluciones de seña.
