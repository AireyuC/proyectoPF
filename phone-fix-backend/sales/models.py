from django.db import models

class Sale(models.Model):
    user = models.ForeignKey('staff.User', on_delete=models.PROTECT, verbose_name="Vendedor")
    payment_cash = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Pago en Efectivo (Bs.)")
    payment_qr = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Pago por QR (Bs.)")
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Total Cobrado (Bs.)")
    receipt_minio_key = models.CharField(max_length=255, blank=True, null=True, verbose_name="Comprobante en MinIO")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Venta")

    class Meta:
        verbose_name = "Venta Mostrador"
        verbose_name_plural = "Ventas (POS)"
        ordering = ['-created_at']

    def __str__(self):
        return f"Venta #{self.id} - Bs. {self.total} ({self.created_at.strftime('%d/%m/%Y %H:%M')})"

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, related_name='items', on_delete=models.CASCADE, verbose_name="Venta")
    product = models.ForeignKey('inventory.Product', null=True, blank=True, on_delete=models.SET_NULL, verbose_name="Producto de Catálogo")
    
    # Soporte para Venta Libre / Al Aire (Exclusiva ADMIN)
    is_manual_entry = models.BooleanField(default=False, verbose_name="¿Es ítem manual fuera de catálogo?")
    custom_name = models.CharField(max_length=200, blank=True, null=True, verbose_name="Descripción manual")
    save_to_catalog = models.BooleanField(default=False, verbose_name="¿Poblar en catálogo futuro?")
    
    quantity = models.PositiveIntegerField(default=1, verbose_name="Cantidad")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Precio Unitario (Bs.)")
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Costo Unitario Caja Chica (Bs.)")

    class Meta:
        verbose_name = "Ítem de Venta"
        verbose_name_plural = "Ítems de Venta"

    @property
    def item_name(self):
        if self.product:
            return self.product.name
        return self.custom_name or "Ítem sin nombre"

    @property
    def subtotal(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return f"{self.item_name} x{self.quantity} - Bs. {self.subtotal}"

class CashClose(models.Model):
    date = models.DateField(auto_now_add=True, verbose_name="Fecha del Cierre")
    initial_cash = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Base de Efectivo Inicial (Bs.)")
    
    # Entradas Efectivo vs QR
    sales_cash = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Ventas Mostrador Efectivo (Bs.)")
    sales_qr = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Ventas Mostrador QR (Bs.)")
    repairs_cash = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Cobros Taller Efectivo (Bs.)")
    repairs_qr = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Cobros Taller QR (Bs.)")
    
    # Salidas y Devoluciones
    expenses_cash = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Gastos y Repuestos Caja Chica (Bs.)")
    deposit_refunds_cash = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Señas Devueltas por Reparaciones Fallidas (Bs.)")
    
    # Arqueo Conciliado
    expected_cash = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Efectivo en mano esperado (Bs.)")
    actual_cash = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Efectivo físico contado (Bs.)")
    difference = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Diferencia (+/- Bs.)")
    
    expected_qr_total = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Total esperado en extracto banco QR (Bs.)")
    receipt_minio_key = models.CharField(max_length=255, blank=True, null=True, verbose_name="Foto / Comprobante de Cierre en MinIO")
    closed_by = models.ForeignKey('staff.User', on_delete=models.PROTECT, verbose_name="Cerrado por")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Cierre de Caja Diario"
        verbose_name_plural = "Cierres de Caja Diarios"
        ordering = ['-date']

    def calculate_expected_cash(self):
        """Cálculo automático de dinero en mano"""
        return (self.initial_cash + self.sales_cash + self.repairs_cash) - (self.expenses_cash + self.deposit_refunds_cash)

    def calculate_expected_qr(self):
        """Cálculo automático de dinero bancario"""
        return self.sales_qr + self.repairs_qr

    def __str__(self):
        return f"Cierre {self.date.strftime('%d/%m/%Y')} - Dif: Bs. {self.difference}"
