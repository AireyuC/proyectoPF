from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Role, Permission, RolePermission

class RolePermissionInline(admin.TabularInline):
    model = RolePermission
    extra = 1

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'is_protected', 'created_at')
    search_fields = ('name', 'description')
    inlines = [RolePermissionInline]

@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'module', 'created_at')
    list_filter = ('module',)
    search_fields = ('code', 'name', 'description')

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Información de Rol y Permisos', {'fields': ('role', 'role_ref')}),
    )
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'role_ref', 'is_staff')
    list_filter = ('role', 'role_ref', 'is_staff', 'is_active')
