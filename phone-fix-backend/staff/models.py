from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Roles(models.TextChoices):
        ADMIN = "ADMIN", "Administrador"
        STAFF = "STAFF", "Staff (Técnico/Recepcionista)"

    role = models.CharField(
        max_length=10, 
        choices=Roles.choices, 
        default=Roles.STAFF
    )

    def is_admin(self):
        return self.role == self.Roles.ADMIN

    def __str__(self):
        return f"{self.username} - {self.get_role_display()}"
