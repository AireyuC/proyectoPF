from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'sale_price', 'cost_price', 'stock', 'min_stock', 'is_stock_managed', 'location')
    list_filter = ('category', 'is_stock_managed')
    search_fields = ('name', 'location')
    ordering = ('name',)
