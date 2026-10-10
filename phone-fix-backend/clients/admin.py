from django.contrib import admin
from .models import Client

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'ci', 'phone_primary', 'phone_reference', 'is_vip', 'created_at')
    list_filter = ('is_vip', 'created_at')
    search_fields = ('full_name', 'ci', 'phone_primary', 'phone_reference')
    ordering = ('-created_at',)
