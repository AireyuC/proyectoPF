from django.contrib import admin
from .models import Supplier, Device, RepairOrder, RepairPartItem

class RepairPartItemInline(admin.TabularInline):
    model = RepairPartItem
    extra = 1

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_internal', 'market_place', 'booth_number', 'contact_name', 'phone_reference')
    list_filter = ('is_internal', 'market_place')
    search_fields = ('name', 'market_place', 'booth_number', 'contact_name', 'phone_reference')

@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ('brand', 'model', 'color', 'imei', 'created_at')
    search_fields = ('brand', 'model', 'imei')

@admin.register(RepairOrder)
class RepairOrderAdmin(admin.ModelAdmin):
    list_display = ('ticket_number', 'client', 'device', 'status', 'warranty', 'estimated_total', 'profit', 'is_abandoned', 'created_at')
    list_filter = ('status', 'warranty', 'is_abandoned', 'created_at')
    search_fields = ('ticket_number', 'client__full_name', 'client__ci', 'device__brand', 'device__model')
    inlines = [RepairPartItemInline]
    date_hierarchy = 'created_at'
