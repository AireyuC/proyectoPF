# 09. Plan de Implementación: Mejoras Críticas PhoneFix (Fase 4+)

Este documento especifica la arquitectura, modelos, componentes gráficos y flujo operativo para implementar las cuatro mejoras solicitadas en el sistema **PhoneFix** (Montero, Santa Cruz), incorporando los **hallazgos y ajustes técnicos identificados en la revisión profunda del backend**.

---

## 1. Hallazgos Técnicos en Backend & Infraestructura

Antes de la construcción de las vistas del frontend, la auditoría del backend reveló los siguientes requerimientos y correcciones que se integran en este plan:

### A. Infraestructura MinIO & `botocore` (Resuelto)
* **Validación RFC de Hostnames en `botocore`:** `boto3` valida los hostnames mediante expresiones regulares que rechazan caracteres de guion bajo (`_`). Debido a que el contenedor de MinIO se llama `minio_pfix`, las llamadas arrojaban `ValueError: Invalid endpoint: http://minio_pfix:9000`.
* **Solución aplicada:** Se configura el alias de red `minio` en [`docker-compose.yml`](file:///d:/proyectoPF/docker-compose.yml) y el servicio de almacenamiento resuelve la IP directa del contenedor en la red Docker (`172.22.0.x`).
* **Inicialización automática de Buckets:** El bucket `phonefix-media` se creará automáticamente en la inicialización del cliente S3 con directiva de acceso a comprobantes.
* **Motor de PDF:** Instalación e inclusión de `reportlab>=4.0.0` y `pillow>=9.0.0` en [`requirements.txt`](file:///d:/proyectoPF/phone-fix-backend/requirements.txt) para generación nativa de documentos sin dependencias de navegadores externos.

### B. Ajustes en Modelos y Migraciones Django
* **Trazabilidad de Comprobantes en [`RepairOrder`](file:///d:/proyectoPF/phone-fix-backend/workshop/models.py):**
  * `invoice_pdf_key = models.CharField(max_length=255, blank=True, null=True, verbose_name="Clave MinIO Comprobante PDF")`
  * `invoice_number = models.CharField(max_length=50, blank=True, null=True, verbose_name="Nº de Factura / Comprobante")`
  * `invoice_generated_at = models.DateTimeField(blank=True, null=True, verbose_name="Fecha de Generación de Factura")`
* **Cálculo Canónico de Abandono en [`RepairOrderType`](file:///d:/proyectoPF/phone-fix-backend/workshop/graphql.py):**
  * Agregar `days_in_workshop: int` y `is_abandonment_eligible: bool` calculados en el servidor para evitar discrepancias de cálculo por zona horaria o reloj del cliente.

---

## 2. Módulo de Proveedores, Casetas, Marcas y Modelos

### A. Diagnóstico y Necesidad
El backend cuenta con el modelo [`Supplier`](file:///d:/proyectoPF/phone-fix-backend/workshop/models.py#L5-L25), pero solo expone `create_supplier`. No existe actualización, eliminación ni interfaz visual dedicada en el frontend para gestionar la red de proveedores y casetas de Montero y Santa Cruz (Chiriguano, Mercado Central, etc.).

### B. Especificación en Backend (GraphQL)
* **Mutaciones a incorporar en [`workshop/graphql.py`](file:///d:/proyectoPF/phone-fix-backend/workshop/graphql.py):**
  1. `update_supplier(id: Int!, input: SupplierInput!) -> SupplierType`: Permite modificar nombre, mercado, caseta, técnico y teléfono de contacto.
  2. `delete_supplier(id: Int!) -> Boolean`: Eliminación segura con validación de repuestos imputados.
* **Query de Presets de Marcas y Modelos:**
  * `device_brand_presets() -> [BrandPresetType]`: Retorna catálogo base de marcas líderes (*Samsung, Apple, Xiaomi/Redmi, Motorola, Infinix, Tecno Mobile, Honor, Huawei, Realme*) junto con marcas y modelos ya registrados en el histórico del taller.

### C. Especificación en Frontend
1. **Directorio de Proveedores ([`SuppliersPage.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/features/workshop/pages/SuppliersPage.tsx)):**
   * Vista accesible desde el menú lateral (`/proveedores`).
   * Grilla Cyber-Clean con tarjetas de proveedores y casetas:
     * Nombre comercial y etiqueta si es stock interno o caseta externa.
     * Ubicación destacada (ej: *Comercial Chiriguano - Caseta 42*).
     * Contacto y botón de acceso directo a WhatsApp (`https://wa.me/591...`).
     * Especialidad técnica (ej: *Pantallas AMOLED, Flex de carga, Baterías*).
     * Botones de Acción: [Editar] y [Eliminar].
2. **Modal Rápido de Proveedor ([`SupplierModal.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/features/workshop/components/SupplierModal.tsx)):**
   * Reutilizable tanto en el directorio como desde [`AddLineItemModal.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/features/workshop/components/AddLineItemModal.tsx) mediante un botón `+ Nueva Caseta / Proveedor`.
3. **Autocompletado de Marcas y Modelos ([`NewOrderPage.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/features/reception/pages/NewOrderPage.tsx)):**
   * Inputs con elementos `<datalist>` dinámicos que sugieren opciones mientras el usuario escribe, permitiendo registrar libremente cualquier modelo nuevo sin bloqueos.

---

## 3. Flujo de Cotización Diferida (Post-Registro / Presupuesto Bs. 0)

### A. Diagnóstico de la Operación Real
En el taller de Montero, la mayoría de teléfonos requieren desarmado previo o consultar existencias de repuestos con casetas antes de fijar un precio. No se puede forzar un presupuesto al momento de recibir el equipo si el cliente tiene prisa o si el costo depende de un diagnóstico.

### B. Especificación en Backend (GraphQL)
* **Nueva Mutación en [`workshop/graphql.py`](file:///d:/proyectoPF/phone-fix-backend/workshop/graphql.py):**
  ```graphql
  mutation UpdateRepairQuote(
    $ticketNumber: String!
    $estimatedTotal: Float!
    $technicianNotes: String
    $status: String
  ) {
    updateRepairQuote(
      ticketNumber: $ticketNumber
      estimatedTotal: $estimatedTotal
      technicianNotes: $technicianNotes
      status: $status
    ) {
      ticketNumber
      estimatedTotal
      remainingBalance
      status
      statusDisplay
      technicianNotes
    }
  }
  ```
* **Lógica Financiera:** Al actualizar `estimatedTotal`, el campo derivado `remainingBalance` (`estimatedTotal - paid`) se recalcula en tiempo real.

### C. Especificación en Frontend
1. **Recepción ([`NewOrderPage.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/features/reception/pages/NewOrderPage.tsx)):**
   * Se añade selector de modalidad de recepción:
     * `[ 💵 Presupuesto Acordado Inmediato ]`
     * `[ 🔍 Pendiente de Diagnóstico / Consulta de Repuesto (Bs. 0) ]`
   * Si se selecciona pendiente, el campo de cotización se fija en `0.00` y el estado inicial se asigna a `DIAGNOSTICO`.
2. **Taller y Detalle de Orden ([`RepairDetailModal.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/features/workshop/components/RepairDetailModal.tsx)):**
   * Si `estimatedTotal === 0` o el estado es `DIAGNOSTICO` o `ESPERA_CLIENTE`:
     * Se despliega un panel destacado: **"Presupuesto Pendiente de Definición"**.
     * Input para ingresar el monto cotizado en Bs. y notas técnicas del diagnóstico.
     * **Botón Un Clic WhatsApp:** Genera enlace `wa.me` con mensaje formal:
       > *"Hola [Cliente], te saludamos de PhoneFix Montero. Tu equipo [Marca/Modelo] (Ticket #[Ticket]) ya fue revisado. El presupuesto de la reparación es de Bs. [Monto] por [Trabajo]. Por favor confírmanos si autorizas proceder con el trabajo."*
     * **Botones Rápidos de Decisión:**
       * `[ ✅ Cliente Autorizó Reparación ]` ➔ Actualiza monto y avanza a `EN_PROCESO`.
       * `[ ❌ Cliente Rechazó Presupuesto ]` ➔ Actualiza a `RECHAZADO_ESPERA`.

---

## 4. Rediseño del Botón de Abandono (> 3 Meses / 90 Días)

### A. Diagnóstico y Necesidad
El botón de abandono no debe estorbar durante el flujo ordinario de reparación, pero debe llamar enérgicamente la atención del Administrador cuando un equipo cumple más de 90 días sin ser retirado.

### B. Especificación de Comportamiento
1. **Determinación del Estado:**
   * Utiliza el campo del backend `order.isAbandonmentEligible` (`daysInWorkshop >= 90` y `deliveredAt == null`).
2. **Estado Ordinario (< 90 Días):**
   * Se traslada a la esquina superior del modal [`RepairDetailModal.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/features/workshop/components/RepairDetailModal.tsx) como un botón secundario discreto (`text-xs text-slate-500 border border-slate-700 hover:text-slate-300`).
3. **Estado Crítico (>= 90 Días y sin retirar):**
   * Se convierte en un **Banner de Alerta Neón Púrpura / Carmesí** en la cabecera o pie del modal:
     ```tsx
     <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-red-950/80 to-purple-950/80 border-2 border-purple-500 shadow-2xl shadow-purple-500/20">
       <div className="flex items-center justify-between gap-4">
         <div>
           <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
             <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
             ⚠️ PLAZO DE 90 DÍAS VENCIDO ({order.daysInWorkshop} DÍAS EN TALLER)
           </div>
           <p className="text-xs text-slate-400 mt-0.5">
             El equipo califica para ser absorbido como activo comercial de PhoneFix según la normativa de abandono.
           </p>
         </div>
         <Can do="taller.ordenes.declarar_abandono">
           <button onClick={handleDeclareAbandonment} className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-500 hover:to-red-500 text-white font-extrabold text-sm rounded-xl shadow-lg transition-transform active:scale-95 animate-pulse">
             Absorber como Activo
           </button>
         </Can>
       </div>
     </div>
     ```
4. **Visibilidad en el Tablero ([`WorkshopPage.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/features/workshop/pages/WorkshopPage.tsx)):**
   * Las tarjetas de equipos con `isAbandonmentEligible = true` exhiben un borde exterior púrpura luminoso y un badge `⏳ >90d Abandono`.

---

## 5. Módulo de Generación de Factura / Comprobante de Entrega (MinIO S3)

### A. Diagnóstico y Arquitectura
Al momento de entregar el equipo reparado (o a requerimiento del cliente), se debe emitir un comprobante oficial de entrega y garantía con el logo cuadrado de PhoneFix, almacenado de forma permanente en **MinIO Object Storage**.

```
[Frontend: Botón "Generar Comprobante"]
                 │
                 ▼
[GraphQL: generateRepairInvoice(ticketNumber)]
                 │
                 ├──► Consulta datos del Taller (Montero, ASOTTECMO, NIT)
                 ├──► Consulta cliente, dispositivo, repuestos, garantía, pagos bicanal
                 ├──► Genera PDF nativo con ReportLab (Formato Recibo 80mm y A4)
                 │    incrustando Logo Oficial Cuadrado PhoneFix
                 │
                 ├──► Sube binario a MinIO: `phonefix-media/invoices/ticket-PF-XXXX.pdf`
                 ├──► Actualiza `invoice_pdf_key` e `invoice_number` en RepairOrder
                 │
                 └──► Retorna { ticketNumber, invoicePdfKey, invoicePdfUrl, invoiceNumber }
```

### B. Datos del Comprobante
1. **Encabezado Institucional:**
   * **Logo Oficial PhoneFix:** Imagen cuadrada (`Pitch Black #080B11`, monograma `PF Cyan/White`).
   * **Razón Social:** PHONEFIX MONTERO • TALLER ESPECIALIZADO DE MICROELECTRÓNICA
   * **Afiliación:** ASOTTECMO (Asociación de Tiendas y Técnicos de Celulares Montero).
   * **Dirección:** Montero, Santa Cruz - Bolivia.
   * **NIT / Contacto:** NIT: 8960735014 | WhatsApp: +591 76000000.
2. **Cuerpo del Comprobante:**
   * Nº de Ticket Correlativo y Nº de Comprobante.
   * Datos del Cliente: Nombre, C.I., Teléfono de referencia.
   * Dispositivo: Marca, Modelo, Color, IMEI (si aplica).
   * Detalle de Mano de Obra y Repuestos sustituidos.
   * Liquidación Financiera Bicanal:
     * Monto Total Acordado (Bs.).
     * Anticipo/Seña Pagada (Efectivo / QR).
     * Saldo Final Cancelado (Efectivo / QR).
     * Saldo Pendiente: Bs. 0.00.
   * **Garantía Legal:** Período (3 semanas por defecto) y Fecha exacta de caducidad.
   * Cláusula de validez y espacio para firma de conformidad del cliente (conforme a los talonarios físicos tradicionales de Montero).

---

## 6. Cronograma de Pasos de Ejecución (100% COMPLETADO)

| Paso | Módulo | Tareas Técnicas Concretas | Archivos Principales | Estado |
| :---: | :--- | :--- | :--- | :---: |
| **Paso 1** | **Backend: Modelos y Almacenamiento MinIO** | • Actualizar [`requirements.txt`](file:///d:/proyectoPF/phone-fix-backend/requirements.txt) (`reportlab`, `pillow`).<br>• Agregar campos de factura en [`RepairOrder`](file:///d:/proyectoPF/phone-fix-backend/workshop/models.py).<br>• Crear migración Django en contenedor.<br>• Crear módulo `workshop/invoices.py` con cliente S3 MinIO y generador de comprobantes PDF con logo oficial. | `phone-fix-backend/requirements.txt`<br>`phone-fix-backend/workshop/models.py`<br>`phone-fix-backend/workshop/invoices.py` | ✅ **COMPLETADO** |
| **Paso 2** | **Backend: Mutaciones GraphQL** | • Implementar `update_supplier` y `delete_supplier`.<br>• Implementar `update_repair_quote`.<br>• Implementar `generate_repair_invoice`.<br>• Exponer campos `days_in_workshop`, `is_abandonment_eligible`, `invoice_pdf_key` e `invoice_number` en `RepairOrderType`.<br>• Exponer query `device_brand_presets`. | `phone-fix-backend/workshop/graphql.py` | ✅ **COMPLETADO** |
| **Paso 3** | **Frontend: Gestión de Proveedores & Presets** | • Crear [`SuppliersPage.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/features/workshop/pages/SuppliersPage.tsx) con CRUD de casetas/proveedores.<br>• Integrar ruta y menú lateral en [`MainLayout.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/components/layout/MainLayout.tsx) y [`App.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/App.tsx).<br>• Integrar modal de creación rápida en [`AddLineItemModal.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/features/workshop/components/AddLineItemModal.tsx).<br>• Añadir autocompletado de marcas y modelos en [`NewOrderPage.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/features/reception/pages/NewOrderPage.tsx). | `phone-fix-frontend/src/features/workshop/pages/SuppliersPage.tsx`<br>`phone-fix-frontend/src/features/workshop/components/SupplierModal.tsx`<br>`phone-fix-frontend/src/components/layout/MainLayout.tsx` | ✅ **COMPLETADO** |
| **Paso 4** | **Frontend: Cotización Diferida & Abandono Reactivo** | • En [`NewOrderPage.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/features/reception/pages/NewOrderPage.tsx): permitir registro con Bs. 0 (Diagnóstico pendiente).<br>• En [`RepairDetailModal.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/features/workshop/components/RepairDetailModal.tsx): agregar panel de cotización pendiente, botón WhatsApp con mensaje estructurado y botones de aprobación/rechazo.<br>• Mover botón de abandono a esquina discreta (<90 días) y transformar en banner gigante parpadeante púrpura (>=90 días).<br>• Añadir alerta de 90 días en tarjetas de [`WorkshopPage.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/features/workshop/pages/WorkshopPage.tsx). | `phone-fix-frontend/src/features/reception/pages/NewOrderPage.tsx`<br>`phone-fix-frontend/src/features/workshop/components/RepairDetailModal.tsx`<br>`phone-fix-frontend/src/features/workshop/pages/WorkshopPage.tsx` | ✅ **COMPLETADO** |
| **Paso 5** | **Frontend: Visor y Generación de Factura PDF** | • Añadir botón "Generar Comprobante PDF" en [`RepairDetailModal.tsx`](file:///d:/proyectoPF/phone-fix-frontend/src/features/workshop/components/RepairDetailModal.tsx) al entregar o reparar.<br>• Conectar con la mutación `generateRepairInvoice`.<br>• Permitir previsualizar e imprimir en ventana emergente o pestaña directa del navegador. | `phone-fix-frontend/src/features/workshop/components/RepairDetailModal.tsx` | ✅ **COMPLETADO** |
| **Paso 6** | **Compilación & Verificación** | • Ejecutar `docker compose up -d --build` y validar 0 errores de tipado TypeScript.<br>• Verificar la persistencia del archivo en MinIO mediante llamada a la API y comprobación en navegador. | Consola / Docker | ✅ **COMPLETADO** |
