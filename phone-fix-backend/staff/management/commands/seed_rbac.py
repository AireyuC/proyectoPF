from django.core.management.base import BaseCommand
from staff.models import Role, Permission, RolePermission

PERMISSIONS_DATA = [
    # Seguridad
    ("seguridad.usuarios.ver", "Ver Usuarios", "Listar usuarios y personal técnico", "Seguridad"),
    ("seguridad.usuarios.gestionar", "Gestionar Usuarios", "Crear, editar y dar de baja usuarios", "Seguridad"),
    ("seguridad.roles.gestionar", "Gestionar Roles y Permisos", "Crear roles y asignar matriz de permisos", "Seguridad"),
    
    # Recepción
    ("recepcion.ordenes.crear", "Registrar Recepción", "Crear nuevas órdenes de servicio y tickets", "Recepción"),
    ("recepcion.ordenes.editar", "Modificar Orden Inicial", "Cambiar diagnóstico preliminar o cotización", "Recepción"),
    
    # Taller
    ("taller.reparaciones.ver", "Ver Taller Activo", "Ver lista y estados de equipos en taller", "Taller"),
    ("taller.reparaciones.estado", "Cambiar Estado de Reparación", "Pasar a Diagnóstico, Proceso o Terminado", "Taller"),
    ("taller.repuestos.asignar_interno", "Usar Repuesto Interno", "Imputar piezas desde el almacén propio", "Taller"),
    ("taller.repuestos.compra_externa", "Registrar Compra Externa", "Cargar repuestos comprados en proveedores", "Taller"),
    ("taller.reparaciones.entregar", "Entregar Dispositivo", "Finalizar y liquidar orden de taller", "Taller"),
    ("taller.ordenes.declarar_abandono", "Declarar Abandono (> 3 Meses)", "Autorizar absorción de equipo no retirado como activo (Exclusivo ADMIN)", "Taller"),
    
    # Inventario
    ("inventario.productos.ver", "Ver Inventario", "Ver catálogo y existencias", "Inventario"),
    ("inventario.productos.crear", "Crear Producto", "Registrar nuevos repuestos o accesorios", "Inventario"),
    ("inventario.stock.ajustar", "Ajustar Stock", "Modificar existencias físicas", "Inventario"),
    ("inventario.costos.ver", "Ver Costos Privados", "Visualizar precio de costo del negocio", "Inventario"),
    
    # Ventas (POS)
    ("ventas.pos.vender", "Operar Punto de Venta", "Vender accesorios del catálogo oficial", "Ventas (POS)"),
    ("ventas.pos.venta_libre", "Venta Libre / Al Aire", "Permite escribir productos y precios manuales fuera de catálogo (Exclusivo ADMIN)", "Ventas (POS)"),
    
    # Caja
    ("caja.movimientos.ver", "Ver Movimientos de Caja", "Ver sumatorias de ingresos y egresos", "Caja"),
    ("caja.gastos.registrar", "Registrar Gastos", "Registrar egresos operativos menores", "Caja"),
    ("caja.cierre.realizar", "Realizar Cierre de Caja", "Efectuar arqueo y balance diario", "Caja"),
    
    # Clientes
    ("clientes.cartera.ver", "Ver Clientes", "Consultar historial y datos de clientes", "Clientes"),
    ("clientes.cartera.gestionar", "Gestionar Clientes", "Crear, editar y categorizar clientes VIP", "Clientes"),
]

class Command(BaseCommand):
    help = "Poblar el catálogo de roles y permisos iniciales de PhoneFix (RBAC)"

    def handle(self, *args, **options):
        self.stdout.write("Poblando permisos granulares...")
        created_perms = 0
        perm_objs = {}
        for code, name, desc, mod in PERMISSIONS_DATA:
            p, created = Permission.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "description": desc,
                    "module": mod
                }
            )
            perm_objs[code] = p
            if created:
                created_perms += 1

        self.stdout.write(self.style.SUCCESS(f"Total permisos procesados: {len(perm_objs)} ({created_perms} nuevos)."))

        # Rol: Administrador
        admin_role, _ = Role.objects.get_or_create(
            name="Administrador",
            defaults={"description": "Acceso total y control de la empresa", "is_protected": True}
        )
        for p in perm_objs.values():
            RolePermission.objects.get_or_create(role=admin_role, permission=p)

        # Rol: Técnico de Taller
        tech_role, _ = Role.objects.get_or_create(
            name="Técnico",
            defaults={"description": "Diagnóstico, reparación y gestión de repuestos", "is_protected": False}
        )
        tech_perms = [
            "taller.reparaciones.ver",
            "taller.reparaciones.estado",
            "taller.repuestos.asignar_interno",
            "taller.repuestos.compra_externa",
            "recepcion.ordenes.crear",
            "recepcion.ordenes.editar",
            "inventario.productos.ver",
            "clientes.cartera.ver",
        ]
        for code in tech_perms:
            if code in perm_objs:
                RolePermission.objects.get_or_create(role=tech_role, permission=perm_objs[code])

        # Rol: Recepción / Cajero
        recep_role, _ = Role.objects.get_or_create(
            name="Recepción y Caja",
            defaults={"description": "Atención al cliente, ingreso de equipos, ventas POS y cobros", "is_protected": False}
        )
        recep_perms = [
            "recepcion.ordenes.crear",
            "recepcion.ordenes.editar",
            "taller.reparaciones.ver",
            "taller.reparaciones.entregar",
            "ventas.pos.vender",
            "caja.movimientos.ver",
            "caja.gastos.registrar",
            "caja.cierre.realizar",
            "clientes.cartera.ver",
            "clientes.cartera.gestionar",
            "inventario.productos.ver",
        ]
        for code in recep_perms:
            if code in perm_objs:
                RolePermission.objects.get_or_create(role=recep_role, permission=perm_objs[code])

        self.stdout.write(self.style.SUCCESS("Roles y permisos iniciales sembrados exitosamente."))
