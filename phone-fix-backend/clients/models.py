from django.db import models

class Client(models.Model):
    full_name = models.CharField(max_length=150, verbose_name="Nombres y Apellidos")
    ci = models.CharField(max_length=30, blank=True, null=True, verbose_name="C.I. / NIT")
    phone_primary = models.CharField(max_length=20, verbose_name="Celular Principal (WhatsApp)")
    phone_reference = models.CharField(max_length=20, blank=True, null=True, verbose_name="Teléfono de Referencia (Telf./Ref.)")
    email = models.EmailField(blank=True, null=True, verbose_name="Correo Electrónico")
    is_vip = models.BooleanField(default=False, verbose_name="Cliente VIP / Revendedor")
    notes = models.TextField(blank=True, null=True, verbose_name="Notas de Fidelización")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Registro")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última Actualización")

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        ordering = ['-created_at']

    def __str__(self):
        vip_tag = " [VIP]" if self.is_vip else ""
        return f"{self.full_name}{vip_tag} - {self.phone_primary}"
