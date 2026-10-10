from django.db import models

class Product(models.Model):
    class Category(models.TextChoices):
        REPUESTO = 'REPUESTO', 'Repuesto'
        ACCESORIO = 'ACCESORIO', 'Accesorio'
        HERRAMIENTA = 'HERRAMIENTA', 'Herramienta'
        SERVICIO = 'SERVICIO', 'Servicio Técnico Express'
        OTRO = 'OTRO', 'Otro'

    name = models.CharField(max_length=200, verbose_name="Nombre del Producto / Repuesto")
    category = models.CharField(
        max_length=20, 
        choices=Category.choices, 
        default=Category.ACCESORIO,
        verbose_name="Categoría"
    )
    cost_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0, 
        verbose_name="Precio de Costo (Caja Chica - Privado)"
    )
    sale_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0, 
        verbose_name="Precio de Venta al Público (Bs.)"
    )
    
    # Flags para Inventario Progresivo (Bypass de Stock inicial)
    is_stock_managed = models.BooleanField(
        default=False, 
        verbose_name="¿Controlar existencias estrictas?"
    )
    stock = models.IntegerField(default=0, verbose_name="Existencias actuales")
    min_stock = models.IntegerField(default=2, verbose_name="Alerta de Stock Mínimo")
    location = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        verbose_name="Ubicación física en tienda (Estante / Casillero)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Producto / Repuesto"
        verbose_name_plural = "Inventario de Productos"
        ordering = ['name']

    @property
    def is_low_stock(self):
        if not self.is_stock_managed:
            return False
        return self.stock <= self.min_stock

    def __str__(self):
        return f"{self.name} ({self.get_category_display()}) - Bs. {self.sale_price}"
