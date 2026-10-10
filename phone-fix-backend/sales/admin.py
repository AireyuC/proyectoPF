from django.contrib import admin
from .models import Sale, SaleItem, CashClose

class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 1

@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total', 'payment_cash', 'payment_qr', 'created_at')
    list_filter = ('created_at', 'user')
    inlines = [SaleItemInline]
    date_hierarchy = 'created_at'

@admin.register(CashClose)
class CashCloseAdmin(admin.ModelAdmin):
    list_display = ('date', 'initial_cash', 'expected_cash', 'actual_cash', 'difference', 'expected_qr_total', 'closed_by')
    list_filter = ('date', 'closed_by')
    ordering = ('-date',)
