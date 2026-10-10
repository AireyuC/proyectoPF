from django.db import models
from django.utils import timezone
from datetime import timedelta

class Supplier(models.Model):
    """Directorio de proveedores y casetas (Montero, Chiriguano, La Ramada, etc.)"""
    name = models.CharField(max_length=100, unique=True, verbose_name="Nombre de la Tienda / Proveedor (Obligatorio)")
    is_internal = models.BooleanField(default=False, verbose_name="¿Es stock propio de PhoneFix?")
    market_place = models.CharField(max_length=100, blank=True, null=True, verbose_name="Lugar o Mercado (Ej: Comercial Chiriguano)")
    booth_number = models.CharField(max_length=50, blank=True, null=True, verbose_name="Nº de Caseta / Pasillo")
    address = models.CharField(max_length=150, blank=True, null=True, verbose_name="Dirección física")
    contact_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="Nombre del Técnico / Encargado")
    phone_reference = models.CharField(max_length=20, blank=True, null=True, verbose_name="Celular / WhatsApp de Referencia")
    notes = models.TextField(blank=True, null=True, verbose_name="Especialidad o Notas (Ej: Pantallas OLED)")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Proveedor / Caseta"
        verbose_name_plural = "Directorio de Proveedores"
        ordering = ['name']

    def __str__(self):
        place = f" ({self.market_place})" if self.market_place else ""
        booth = f" - Caseta {self.booth_number}" if self.booth_number else ""
        return f"{self.name}{place}{booth}"

class Device(models.Model):
    brand = models.CharField(max_length=50, verbose_name="Marca")
    model = models.CharField(max_length=100, verbose_name="Modelo")
    color = models.CharField(max_length=50, blank=True, null=True, verbose_name="Color")
    
    # IMEI: Opcional por definición del negocio
    imei = models.CharField(max_length=30, blank=True, null=True, verbose_name="IMEI (Opcional)")
    imei_printed = models.CharField(max_length=30, blank=True, null=True, verbose_name="IMEI Impreso")
    
    passcode = models.CharField(max_length=100, blank=True, null=True, verbose_name="Patrón de 9 puntos o PIN")
    physical_condition = models.JSONField(default=list, verbose_name="Detalles físicos (Pantalla rota, mojado...)")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Dispositivo"
        verbose_name_plural = "Dispositivos"

    def __str__(self):
        return f"{self.brand} {self.model} ({self.color or 'Sin color'})"

class RepairOrder(models.Model):
    class Status(models.TextChoices):
        RECIBIDO = 'RECIBIDO', 'Recibido en Recepción'
        DIAGNOSTICO = 'DIAGNOSTICO', 'En Diagnóstico'
        ESPERA_CLIENTE = 'ESPERA_CLIENTE', 'Esperando Autorización de Presupuesto'
        EN_PROCESO = 'EN_PROCESO', 'En Reparación'
        REPARADO_ESPERA = 'REPARADO_ESPERA', 'Reparado (En Espera de Retiro)'
        NO_REPARABLE_ESPERA = 'NO_REPARABLE_ESPERA', 'Sin Solución (En Espera de Retiro)'
        RECHAZADO_ESPERA = 'RECHAZADO_ESPERA', 'Presupuesto Rechazado (En Espera de Retiro)'
        ENTREGADO_REPARADO = 'ENTREGADO_REPARADO', 'Entregado al Cliente (Reparado)'
        ENTREGADO_SIN_REPARAR = 'ENTREGADO_SIN_REPARAR', 'Devuelto al Cliente (Sin Reparar)'
        DECLARADO_ABANDONO = 'DECLARADO_ABANDONO', 'Declarado Abandono (> 3 Meses - Activo del Taller)'

    class WarrantyPeriod(models.TextChoices):
        THREE_WEEKS = '3_SEMANAS', '3 Semanas (Estándar)'
        TWO_WEEKS = '2_SEMANAS', '2 Semanas'
        ONE_MONTH = '1_MES', '1 Mes'
        THREE_MONTHS = '3_MESES', '3 Meses (Pantallas OLED / Original)'
        NO_WARRANTY = 'SIN_GARANTIA', 'Sin Garantía'
        CUSTOM = 'PERSONALIZADO', 'Personalizado'

    ticket_number = models.CharField(max_length=20, unique=True, verbose_name="Nº de Ticket Correlativo")
    client = models.ForeignKey('clients.Client', on_delete=models.PROTECT, related_name='repairs', verbose_name="Cliente")
    device = models.OneToOneField(Device, on_delete=models.CASCADE, verbose_name="Dispositivo")
    
    # Falla, Diagnóstico y Observaciones
    issue_description = models.TextField(verbose_name="Falla declarada por cliente")
    technician_notes = models.TextField(blank=True, null=True, verbose_name="Diagnóstico técnico / Trabajo a realizar")
    tech_observations = models.CharField(max_length=255, blank=True, null=True, verbose_name="Observaciones Técnicas (Ej: Transplante de EPROM)")

    # Garantía (3 semanas por defecto si se repara, corre desde fecha de retiro)
    warranty = models.CharField(max_length=20, choices=WarrantyPeriod.choices, default=WarrantyPeriod.THREE_WEEKS, verbose_name="Garantía")
    warranty_custom_notes = models.CharField(max_length=100, blank=True, null=True, verbose_name="Detalle de Garantía Personalizada")
    warranty_expires_at = models.DateField(blank=True, null=True, verbose_name="Fecha de Vencimiento de Garantía")

    # Proveedor del repuesto principal
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Proveedor Principal")

    # --- Finanzas Trazables (Diferenciando Seña de Saldo Final) ---
    estimated_total = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Presupuesto Total Cotizado (Bs.)")
    
    # Anticipo / Seña (Al ingresar)
    deposit_cash = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Seña en Efectivo (Bs.)")
    deposit_qr = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Seña por QR (Bs.)")
    deposit_refunded = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Seña Devuelta si falló (Bs.)")
    deposit_date = models.DateTimeField(blank=True, null=True, verbose_name="Fecha del Pago de Seña")

    # Saldo Final (Al retirar)
    final_payment_cash = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Saldo Final Efectivo (Bs.)")
    final_payment_qr = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Saldo Final QR (Bs.)")

    # Costos de Caja Chica y Ganancia Neta
    cost_cash_out = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Salida de Caja Chica / Costo Repuesto (Bs.)")
    profit = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Ganancia Neta (Bs.)")

    status = models.CharField(max_length=30, choices=Status.choices, default=Status.RECIBIDO, verbose_name="Estado Operativo")

    # --- Política de Abandono (> 3 Meses / 90 Días) ---
    is_abandoned = models.BooleanField(default=False, verbose_name="¿Declarado en abandono?")
    abandoned_at = models.DateTimeField(blank=True, null=True, verbose_name="Fecha de Declaración de Abandono")
    abandoned_authorized_by = models.ForeignKey(
        'staff.User', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='abandoned_authorizations',
        verbose_name="Admin que autorizó absorción"
    )
    abandonment_sale_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name="Precio de Venta como Activo")
    
    # --- Referencias MinIO (S3 Keys) ---
    initial_photo_key = models.CharField(max_length=255, blank=True, null=True, verbose_name="Clave MinIO Foto Recepción")
    payment_qr_receipt_key = models.CharField(max_length=255, blank=True, null=True, verbose_name="Clave MinIO Comprobante QR")
    invoice_pdf_key = models.CharField(max_length=255, blank=True, null=True, verbose_name="Clave MinIO Comprobante PDF")
    invoice_number = models.CharField(max_length=50, blank=True, null=True, verbose_name="Nº de Factura / Comprobante")
    invoice_generated_at = models.DateTimeField(blank=True, null=True, verbose_name="Fecha de Generación de Factura")

    delivery_promise_date = models.DateField(blank=True, null=True, verbose_name="Fecha prometida de entrega")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Ingreso")
    delivered_at = models.DateTimeField(blank=True, null=True, verbose_name="Fecha y Hora Real de Retiro / Entrega")

    class Meta:
        verbose_name = "Orden de Servicio / Reparación"
        verbose_name_plural = "Órdenes de Reparación"
        ordering = ['-created_at']

    @property
    def total_collected(self):
        """Total efectivamente pagado por el cliente"""
        return (self.deposit_cash + self.deposit_qr + self.final_payment_cash + self.final_payment_qr) - self.deposit_refunded

    @property
    def remaining_balance(self):
        """Saldo pendiente por cobrar al entregar"""
        paid = (self.deposit_cash + self.deposit_qr) - self.deposit_refunded
        return max(0, self.estimated_total - paid)

    def calculate_profit(self):
        """Ganancia neta: Total cobrado - Costo pagado en caja chica"""
        return self.total_collected - self.cost_cash_out

    def set_delivered(self):
        """Al entregar al cliente: registra la fecha y calcula vencimiento de garantía"""
        if not self.delivered_at:
            self.delivered_at = timezone.now()
        
        # Calcular garantía si fue reparado con éxito
        if self.status == self.Status.ENTREGADO_REPARADO and self.warranty != self.WarrantyPeriod.NO_WARRANTY:
            delivery_date = self.delivered_at.date()
            if self.warranty == self.WarrantyPeriod.THREE_WEEKS:
                self.warranty_expires_at = delivery_date + timedelta(weeks=3)
            elif self.warranty == self.WarrantyPeriod.TWO_WEEKS:
                self.warranty_expires_at = delivery_date + timedelta(weeks=2)
            elif self.warranty == self.WarrantyPeriod.ONE_MONTH:
                self.warranty_expires_at = delivery_date + timedelta(days=30)
            elif self.warranty == self.WarrantyPeriod.THREE_MONTHS:
                self.warranty_expires_at = delivery_date + timedelta(days=90)
        
        self.profit = self.calculate_profit()
        self.save()

    def __str__(self):
        return f"Ticket #{self.ticket_number} - {self.device.brand} {self.device.model} ({self.get_status_display()})"

class RepairPartItem(models.Model):
    class SourceType(models.TextChoices):
        INTERNAL = 'INTERNAL', 'Almacén PhoneFix'
        EXTERNAL = 'EXTERNAL', 'Compra Externa (Caseta/Proveedor)'

    repair_order = models.ForeignKey(RepairOrder, related_name='parts', on_delete=models.CASCADE, verbose_name="Orden")
    source_type = models.CharField(max_length=10, choices=SourceType.choices, default=SourceType.INTERNAL, verbose_name="Origen")
    product = models.ForeignKey('inventory.Product', null=True, blank=True, on_delete=models.SET_NULL, verbose_name="Producto de Almacén")
    name = models.CharField(max_length=150, verbose_name="Descripción de la pieza / Servicio")
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Costo Caja Chica (Bs.)")
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Precio Cobrado al Cliente (Bs.)")
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Proveedor Externo")
    is_paid = models.BooleanField(default=False, verbose_name="¿Ya se pagó al proveedor?")

    class Meta:
        verbose_name = "Repuesto Imputado"
        verbose_name_plural = "Repuestos de la Reparación"

    def __str__(self):
        return f"{self.name} - Bs. {self.price}"
