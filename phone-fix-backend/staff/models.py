from django.contrib.auth.models import AbstractUser
from django.db import models

class Role(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Nombre del Rol")
    description = models.CharField(max_length=255, blank=True, verbose_name="Descripción")
    is_protected = models.BooleanField(default=False, verbose_name="¿Es Rol Protegido?")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Rol"
        verbose_name_plural = "Roles"
        ordering = ['name']

    def __str__(self):
        return self.name

class Permission(models.Model):
    code = models.CharField(max_length=100, unique=True, verbose_name="Clave (modulo.accion)")
    name = models.CharField(max_length=150, verbose_name="Nombre del Permiso")
    description = models.CharField(max_length=255, blank=True, verbose_name="Descripción")
    module = models.CharField(max_length=50, verbose_name="Módulo")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Permiso"
        verbose_name_plural = "Permisos"
        ordering = ['module', 'code']

    def __str__(self):
        return f"{self.module} - {self.name} ({self.code})"

class RolePermission(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="role_permissions")
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name="role_permissions")
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Permiso de Rol"
        verbose_name_plural = "Permisos de Roles"
        unique_together = ('role', 'permission')

    def __str__(self):
        return f"{self.role.name} -> {self.permission.code}"

class User(AbstractUser):
    class Roles(models.TextChoices):
        ADMIN = "ADMIN", "Administrador"
        STAFF = "STAFF", "Staff (Técnico/Recepcionista)"

    # Rol rápido (legado / fallback)
    role = models.CharField(
        max_length=20, 
        choices=Roles.choices, 
        default=Roles.STAFF
    )
    # Rol dinámico RBAC
    role_ref = models.ForeignKey(
        Role, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="users",
        verbose_name="Rol Dinámico (RBAC)"
    )

    def is_admin(self):
        if self.is_superuser:
            return True
        if self.role_ref and self.role_ref.name.upper() in ["ADMIN", "ADMINISTRADOR"]:
            return True
        return self.role == self.Roles.ADMIN

    def has_perm_code(self, perm_code: str) -> bool:
        if self.is_superuser or self.is_admin():
            return True
        if self.role_ref:
            return self.role_ref.role_permissions.filter(permission__code=perm_code).exists()
        return False

    def get_all_permission_codes(self) -> list[str]:
        if self.is_superuser or self.is_admin():
            return list(Permission.objects.values_list('code', flat=True))
        if self.role_ref:
            return list(Permission.objects.filter(role_permissions__role=self.role_ref).values_list('code', flat=True))
        return []

    def __str__(self):
        r_name = self.role_ref.name if self.role_ref else self.get_role_display()
        return f"{self.username} - {r_name}"
