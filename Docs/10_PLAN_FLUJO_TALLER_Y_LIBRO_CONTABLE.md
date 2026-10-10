# 10. Plan de Implementación: Flujo Especializado de Taller, Vista Compacta y Libro Contable Inmutable (Fase 5)

Este documento especifica la arquitectura, modelos, componentes y casos de uso operativos para la reestructuración del taller activo, la vinculación de la fecha de entrega con la cotización, la inmutabilidad de órdenes entregadas y el nuevo módulo de **Libro Contable (Exportación a CSV / Excel)** en el sistema **PhoneFix Montero**.

---

## 1. Diagnóstico de los Casos de Uso y Necesidades Operativas

### A. Vinculación de Fecha de Entrega y Cotización Post-Diagnóstico
* **Situación real:** En recepción, cuando un teléfono ingresa con presupuesto Bs. 0 o para revisión, **es imposible prometer una fecha exacta de entrega**. La fecha de entrega depende de si la pieza está disponible en Montero, si se debe pedir a Santa Cruz (Chiriguano) o si la reparación requiere micro-soldadura.
* **Solución:** La **Fecha Prometida de Entrega** se vuelve opcional en recepción y se vincula formalmente al **Panel de Cotización** tras el diagnóstico físico en el laboratorio.

### B. Separación Operativa del Taller Activo en Dos Fases
El taller no debe mezclar equipos que esperan diagnóstico con equipos que ya están autorizados y en proceso de ensamble. Se definen dos fases claras:
1. **Fase 1: "En Diagnóstico / Revisión" (Cola de Entrada):**
   * Equipos en estados: `RECIBIDO`, `DIAGNOSTICO`, `ESPERA_CLIENTE`.
   * El técnico abre el equipo físicamente, anota:
     * **Defectos totales encontrados** (ej: *pantalla rota, pero además pin sulfatado y micrófono bajo*).
     * **Trabajo autorizado a realizar** (lo que el cliente autoriza expresamente arreglar).
     * **Presupuesto cotizado (Bs.)**.
     * **Fecha prometida de entrega**.
   * Opciones inmediatas:
     * Enviar presupuesto por WhatsApp al cliente a un clic.
     * Si el cliente acepta ➔ Pasa a `EN_PROCESO` y **la ventana se cierra automáticamente**.
     * Si el cliente rechaza ➔ Pasa a `RECHAZADO_ESPERA` y **la ventana se cierra**.
2. **Fase 2: "En Reparación / Mesa de Trabajo" (Equipos Autorizados):**
   * Equipos en estados: `EN_PROCESO` y `REPARADO_ESPERA`.
   * El técnico imputa repuestos (stock PhoneFix o compras en casetas externas).
   * Monitoreo de salidas de caja chica vs cobro al cliente.
   * *Resolución del dilema de cotización:* Si el proveedor de la caseta varía el precio del repuesto o surge un imprevisto técnico, el técnico o admin puede reajustar la cotización manteniendo el control financiero.
   * Al concluir ➔ Marca el equipo como reparado listo para retiro (`REPARADO_ESPERA`).

### C. Modo de Vista Compacta (Listado Predeterminado) vs Modo Tarjetas
* En talleres con alto flujo de trabajo, las tarjetas ocupan demasiado espacio vertical.
* **Comportamiento requerido:**
  * **Modo Lista (Tabla Compacta):** Vista **predeterminada**, con alta densidad de información (ticket, equipo, cliente, WhatsApp, diagnóstico, estado, saldo, días en taller y botón de acción). Permite ver 15-20 órdenes en pantalla.
  * **Modo Tarjetas:** Vista secundaria alternable mediante un selector de vista `[ 📋 Lista ]` / `[ 🗂️ Tarjetas ]`.
  * Al hacer clic en cualquier fila o tarjeta se abre el modal de gestión correspondiente.

### D. Regla de Inmutabilidad para Órdenes Entregadas / Cerradas
* Una vez que un teléfono ha sido retirado por el cliente (`ENTREGADO_REPARADO`, `ENTREGADO_SIN_REPARAR` o `DECLARADO_ABANDONO`):
  * **Los datos de la reparación se bloquean al 100% (Solo Lectura):** no se pueden alterar precios, ni notas técnicas, ni agregar repuestos extemporáneos.
  * Se exhibe un distintivo `🔒 Orden Entregada y Cerrada (Solo Lectura)`.
  * Únicas acciones permitidas: consultar historial de garantía y **abrir / imprimir el Comprobante PDF de MinIO**.

### E. Módulo de Libro Contable (Inmutable / No Editable) en Pantalla y CSV
* **Principio contable:** El usuario consultó si este libro contable debería ser no-editable. **La respuesta es categóricamente SÍ:** un libro contable o historial financiero debe ser **estrictamente inmutable** para garantizar transparencia, auditoría y evitar alteraciones de dinero de caja.
* **Capacidades del módulo:**
  * Vista accesible exclusivamente para el Administrador (`/contabilidad`).
  * Consolidación en tiempo real de:
    * Entradas de Ventas Mostrador (Efectivo y QR).
    * Entradas de Taller (Señas y Saldos bicanal).
    * Salidas de Caja Chica (Compras de repuestos a casetas y gastos).
    * Devoluciones de señas por reparaciones fallidas.
    * Ganancia neta real del período.
  * Filtros por rangos de fechas (Hoy, Esta Semana, Este Mes, Rango Personalizado).
  * **Exportación a CSV / Excel:** Generación de archivo descargable con encabezados contables y codificación UTF-8 BOM compatible directamente con Microsoft Excel en español/Bolivia.

---

## 2. Especificación Técnica de Backend (Django & GraphQL)

### A. Mutación Ampliada `update_repair_quote`
En [`phone-fix-backend/workshop/graphql.py`](file:///d:/proyectoPF/phone-fix-backend/workshop/graphql.py), incorporar el parámetro `delivery_promise_date` para sincronizar cotización y fecha de compromiso en una sola llamada:

```python
@strawberry.mutation
def update_repair_quote(
    self,
    ticket_number: str,
    estimated_total: float,
    technician_notes: Optional[str] = None,
    tech_observations: Optional[str] = None,
    delivery_promise_date: Optional[str] = None,
    status: Optional[str] = None
) -> Optional[RepairOrderType]:
```

### B. Validación de Inmutabilidad en Backend
En las mutaciones de taller (`update_repair_quote`, `update_repair_status`, `add_repair_part`):
* Si `order.status in ['ENTREGADO_REPARADO', 'ENTREGADO_SIN_REPARAR', 'DECLARADO_ABANDONO']`:
  * Lanzar excepción: `ValidationError("Esta orden ya ha sido entregada y cerrada. Sus datos contables y técnicos son inmutables.")`.

### C. Esquema GraphQL para el Libro Contable ([`sales/graphql.py`](file:///d:/proyectoPF/phone-fix-backend/sales/graphql.py))

```python
@strawberry.type
class LedgerEntryType:
    id: str
    date: str
    entry_type: str        # 'VENTA', 'SEÑA_TALLER', 'ENTREGA_TALLER', 'DEVOLUCION_SEÑA', 'REPUESTO_CASETA'
    reference: str         # Ticket # o ID de Venta
    description: str
    cash_in: float
    qr_in: float
    cash_out: float
    net_amount: float
    responsible_user: str

@strawberry.type
class LedgerSummaryType:
    total_income: float
    total_cash_in: float
    total_qr_in: float
    total_expenses: float
    net_profit: float
    sales_count: int
    repairs_count: int

@strawberry.type
class AccountingLedgerType:
    summary: LedgerSummaryType
    entries: List[LedgerEntryType]
```

---

## 3. Especificación Técnica de Frontend

### A. Sub-Secciones del Taller Activo ([`WorkshopPage.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/features/workshop/pages/WorkshopPage.tsx))
* **Barra de Navegación de Fases:**
  * `[ 🔍 1. En Diagnóstico / Revisión (X equipos) ]`
  * `[ 🛠️ 2. En Reparación / Mesa de Trabajo (Y equipos) ]`
  * `[ 📋 Todos los Registros ]`
* **Selector de Modo de Visualización:**
  * `[ 📋 Vista Lista (Compacta) ]` ➔ **Predeterminada.**
  * `[ 🗂️ Vista Tarjetas ]` ➔ Secundaria.

### B. Tabla Compacta de Alta Densidad ([`WorkshopTableView.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/features/workshop/components/WorkshopTableView.tsx))
Columnas optimizadas para visualización rápida:
1. **Ticket:** Nº correlativo con badge de abandono (`⚠️ >90d`) si califica.
2. **Equipo:** Marca, Modelo y Color.
3. **Cliente:** Nombre completo y botón directo a WhatsApp.
4. **Falla / Diagnóstico:** Resumen de la falla reportada y trabajo cotizado.
5. **Estado:** Badge Cyber-Clean distintivo.
6. **Finanzas:** Presupuesto (Bs.) y Saldo pendiente (Bs.).
7. **Tiempos:** Días en taller y Fecha prometida de entrega.
8. **Acción:** Botón `[ Gestionar ]` que abre el modal.

### C. Modal de Detalle Especializado ([`RepairDetailModal.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/features/workshop/components/RepairDetailModal.tsx))
1. **Modo Diagnóstico (Equipos en Cola de Revisión):**
   * Campos agrupados:
     * *Defectos detectados en laboratorio* (diagnóstico técnico completo).
     * *Trabajo acordado a reparar* (lo que se intervendrá).
     * *Presupuesto Cotizado (Bs.)*.
     * *Fecha Prometida de Entrega (Calendario)*.
   * Acciones rápidas:
     * `[ 📲 Enviar Cotización por WhatsApp ]`: Formato estructurado con presupuesto, fecha prometida y observaciones.
     * `[ ✅ Cliente Aceptó Trabajo ]`: Guarda datos, asigna estado `EN_PROCESO` y **cierra el modal**.
     * `[ ❌ Presupuesto Rechazado ]`: Guarda datos, asigna estado `RECHAZADO_ESPERA` y **cierra el modal**.
2. **Modo Reparación (Equipos en Mesa de Trabajo):**
   * Desglose de piezas imputadas y botón `+ Imputar Repuesto`.
   * Permite reajuste de cotización en caso de variación de precios en casetas externas.
   * Botón `[ ✅ Marcar Reparado / Listo para Retiro ]`.
3. **Modo Inmutable (Equipos Entregados):**
   * Si el estado es `ENTREGADO_REPARADO`, `ENTREGADO_SIN_REPARAR` o `DECLARADO_ABANDONO`:
     * Todos los campos se transforman en etiquetas de texto estáticas o inputs bloqueados (`readOnly` / `disabled`).
     * Se ocultan los botones de mutación de estados y adición de repuestos.
     * Se resalta el botón: **`[ 🖨️ Abrir / Imprimir Comprobante PDF (MinIO) ]`**.

### D. Nuevo Módulo de Libro Contable ([`AccountingLedgerPage.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/features/sales/pages/AccountingLedgerPage.tsx))
* **Ruta:** `/contabilidad`, protegida para rol `ADMIN` o permiso `caja.movimientos.ver`.
* **Elementos en Pantalla (100% Inmutables):**
  * **Tarjetas KPI Consolidadas:** Total Ingresos, Efectivo en Mano, Banco QR, Gastos de Repuestos, Ganancia Neta.
  * **Filtros Temporales:** Hoy, Últimos 7 Días, Este Mes, Año Actual, Rango Personalizado.
  * **Tabla del Libro Diario:**
    * Fecha y Hora
    * Concepto / Transacción (Venta Mostrador, Cobro Seña, Saldo Entrega, Pago Repuesto Caseta, Devolución)
    * Ticket / Comprobante
    * Entrada Efectivo (Bs.)
    * Entrada QR (Bs.)
    * Salida Caja Chica (Bs.)
    * Ganancia / Saldo Neto (Bs.)
    * Operador Responsable
  * **Botón `[ 📥 Descargar CSV para Excel ]`:**
    * Genera y descarga instantáneamente el archivo con delimitador de coma y caracteres compatibles con Excel (`\uFEFF` UTF-8 BOM).

---

## 4. Cronograma de Pasos de Ejecución

| Paso | Área | Tareas Técnicas Concretas | Archivos Principales |
| :---: | :--- | :--- | :--- |
| **Paso 1** | **Backend: Cotización con Fecha & Inmutabilidad** | • Extender `update_repair_quote` en GraphQL para recibir `delivery_promise_date`.<br>• Implementar validación de bloqueo en mutaciones si la orden ya está entregada o abandonada. | `phone-fix-backend/workshop/graphql.py` |
| **Paso 2** | **Backend: Consulta de Libro Contable & Exportación** | • Crear consulta GraphQL `accountingLedger(startDate, endDate)`.<br>• Consolidar entradas de ventas mostrador, cobros de taller y compras de repuestos en caja chica. | `phone-fix-backend/sales/graphql.py` |
| **Paso 3** | **Frontend: Vista Lista Compacta y Fases del Taller** | • Implementar selector de fases: *1. En Diagnóstico* vs *2. En Reparación*.<br>• Crear componente de tabla compacta [`WorkshopTableView.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/features/workshop/components/WorkshopTableView.tsx) como vista predeterminada.<br>• Mantener selector para alternar a vista de tarjetas. | `phone-fix-frontend/src/features/workshop/pages/WorkshopPage.tsx`<br>`phone-fix-frontend/src/features/workshop/components/WorkshopTableView.tsx` |
| **Paso 4** | **Frontend: Flujo Diagnóstico y Cierre Automático** | • En [`RepairDetailModal.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/features/workshop/components/RepairDetailModal.tsx): vincular campo de fecha de entrega a la cotización.<br>• Cerrar modal automáticamente tras autorizar (`EN_PROCESO`) o rechazar (`RECHAZADO_ESPERA`).<br>• Activar modo inmutable (solo lectura y candado) si la orden ya fue entregada. | `phone-fix-frontend/src/features/workshop/components/RepairDetailModal.tsx` |
| **Paso 5** | **Frontend: Módulo de Libro Contable y Exportador CSV** | • Crear [`AccountingLedgerPage.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/features/sales/pages/AccountingLedgerPage.tsx) con KPIs y tabla de solo lectura.<br>• Implementar exportación a CSV con formato compatible con Excel.<br>• Agregar acceso en el menú lateral de [`MainLayout.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/components/layout/MainLayout.tsx) y ruta protegida en [`App.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/App.tsx). | `phone-fix-frontend/src/features/sales/pages/AccountingLedgerPage.tsx`<br>`phone-fix-frontend/src/components/layout/MainLayout.tsx`<br>`phone-fix-frontend/src/App.tsx` |
| **Paso 6** | **Compilación & Verificación** | • Ejecutar `npm.cmd run build` para asegurar 0 errores de TypeScript.<br>• Validar el flujo de cotización, cierre automático, bloqueo de órdenes entregadas y descarga del CSV contable. | Consola / Docker |
