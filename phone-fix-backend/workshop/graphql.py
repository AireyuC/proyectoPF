import strawberry
from typing import Optional, List
from decimal import Decimal
from datetime import datetime, date, timedelta
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from .models import Supplier, Device, RepairOrder, RepairPartItem
from clients.models import Client
from inventory.models import Product
from core.auth_graphql import get_user_from_jwt
from .invoices import generate_repair_invoice_pdf, get_public_url

@strawberry.type
class BrandPresetType:
    brand: str
    models: List[str]

@strawberry.type
class SupplierType:
    id: int
    name: str
    is_internal: bool
    market_place: Optional[str]
    booth_number: Optional[str]
    address: Optional[str]
    contact_name: Optional[str]
    phone_reference: Optional[str]
    notes: Optional[str]

    @classmethod
    def from_model(cls, s: Supplier) -> "SupplierType":
        return cls(
            id=s.id,
            name=s.name,
            is_internal=s.is_internal,
            market_place=s.market_place,
            booth_number=s.booth_number,
            address=s.address,
            contact_name=s.contact_name,
            phone_reference=s.phone_reference,
            notes=s.notes
        )

@strawberry.type
class DeviceType:
    id: int
    brand: str
    model: str
    color: Optional[str]
    imei: Optional[str]
    imei_printed: Optional[str]
    passcode: Optional[str]
    physical_condition: List[str]

    @classmethod
    def from_model(cls, d: Device) -> "DeviceType":
        return cls(
            id=d.id,
            brand=d.brand,
            model=d.model,
            color=d.color,
            imei=d.imei,
            imei_printed=d.imei_printed,
            passcode=d.passcode,
            physical_condition=d.physical_condition if isinstance(d.physical_condition, list) else []
        )

@strawberry.type
class RepairPartItemType:
    id: int
    name: str
    source_type: str
    cost: float
    price: float
    is_paid: bool
    supplier_name: Optional[str]
    product_name: Optional[str]

    @classmethod
    def from_model(cls, p: RepairPartItem) -> "RepairPartItemType":
        return cls(
            id=p.id,
            name=p.name,
            source_type=p.source_type,
            cost=float(p.cost),
            price=float(p.price),
            is_paid=p.is_paid,
            supplier_name=p.supplier.name if p.supplier else None,
            product_name=p.product.name if p.product else None
        )

@strawberry.type
class RepairOrderType:
    id: int
    ticket_number: str
    client_id: int
    client_name: str
    client_phone: str
    device: DeviceType
    issue_description: str
    technician_notes: Optional[str]
    authorized_work: Optional[str]
    tech_observations: Optional[str]
    status: str
    status_display: str
    warranty: str
    warranty_display: str
    warranty_custom_notes: Optional[str]
    warranty_expires_at: Optional[str]
    supplier_name: Optional[str]
    
    estimated_total: float
    deposit_cash: float
    deposit_qr: float
    deposit_refunded: float
    deposit_date: Optional[str]
    final_payment_cash: float
    final_payment_qr: float
    total_collected: float
    remaining_balance: float
    cost_cash_out: float
    profit: float

    is_abandoned: bool
    abandoned_at: Optional[str]
    abandonment_sale_price: Optional[float]
    initial_photo_key: Optional[str]
    payment_qr_receipt_key: Optional[str]
    delivery_promise_date: Optional[str]
    created_at: str
    delivered_at: Optional[str]
    days_in_workshop: int
    is_abandonment_eligible: bool
    invoice_pdf_key: Optional[str]
    invoice_number: Optional[str]
    invoice_pdf_url: Optional[str]
    invoice_generated_at: Optional[str]
    parts: List[RepairPartItemType]

    @classmethod
    def from_model(cls, o: RepairOrder) -> "RepairOrderType":
        now = timezone.now()
        days = (now - o.created_at).days if o.created_at else 0
        is_abandonment_eligible = bool(days >= 90 and not o.delivered_at and not o.is_abandoned)
        return cls(
            id=o.id,
            ticket_number=o.ticket_number,
            client_id=o.client.id,
            client_name=o.client.full_name,
            client_phone=o.client.phone_primary,
            device=DeviceType.from_model(o.device),
            issue_description=o.issue_description,
            technician_notes=o.technician_notes,
            authorized_work=o.authorized_work,
            tech_observations=o.tech_observations,
            status=o.status,
            status_display=o.get_status_display(),
            warranty=o.warranty,
            warranty_display=o.get_warranty_display(),
            warranty_custom_notes=o.warranty_custom_notes,
            warranty_expires_at=o.warranty_expires_at.isoformat() if o.warranty_expires_at else None,
            supplier_name=o.supplier.name if o.supplier else None,
            estimated_total=float(o.estimated_total),
            deposit_cash=float(o.deposit_cash),
            deposit_qr=float(o.deposit_qr),
            deposit_refunded=float(o.deposit_refunded),
            deposit_date=o.deposit_date.isoformat() if o.deposit_date else None,
            final_payment_cash=float(o.final_payment_cash),
            final_payment_qr=float(o.final_payment_qr),
            total_collected=float(o.total_collected),
            remaining_balance=float(o.remaining_balance),
            cost_cash_out=float(o.cost_cash_out),
            profit=float(o.profit),
            is_abandoned=o.is_abandoned,
            abandoned_at=o.abandoned_at.isoformat() if o.abandoned_at else None,
            abandonment_sale_price=float(o.abandonment_sale_price) if o.abandonment_sale_price is not None else None,
            initial_photo_key=o.initial_photo_key,
            payment_qr_receipt_key=o.payment_qr_receipt_key,
            delivery_promise_date=o.delivery_promise_date.isoformat() if o.delivery_promise_date else None,
            created_at=o.created_at.isoformat() if o.created_at else "",
            delivered_at=o.delivered_at.isoformat() if o.delivered_at else None,
            days_in_workshop=days,
            is_abandonment_eligible=is_abandonment_eligible,
            invoice_pdf_key=o.invoice_pdf_key,
            invoice_number=o.invoice_number,
            invoice_pdf_url=get_public_url(o.invoice_pdf_key) if o.invoice_pdf_key else None,
            invoice_generated_at=o.invoice_generated_at.isoformat() if o.invoice_generated_at else None,
            parts=[RepairPartItemType.from_model(p) for p in o.parts.all()]
        )

@strawberry.input
class SupplierInput:
    name: str
    is_internal: bool = False
    market_place: Optional[str] = None
    booth_number: Optional[str] = None
    address: Optional[str] = None
    contact_name: Optional[str] = None
    phone_reference: Optional[str] = None
    notes: Optional[str] = None

@strawberry.input
class CreateRepairOrderInput:
    client_id: int
    brand: str
    model: str
    color: Optional[str] = None
    imei: Optional[str] = None
    passcode: Optional[str] = None
    physical_condition: List[str] = strawberry.field(default_factory=list)
    issue_description: str = ""
    authorized_work: Optional[str] = None
    estimated_total: float = 0.0
    deposit_cash: float = 0.0
    deposit_qr: float = 0.0
    delivery_promise_date: Optional[str] = None
    initial_photo_key: Optional[str] = None

@strawberry.input
class AddRepairPartInput:
    ticket_number: str
    source_type: str = "INTERNAL"
    product_id: Optional[int] = None
    name: str = ""
    cost: float = 0.0
    price: float = 0.0
    supplier_id: Optional[int] = None
    is_paid: bool = False

@strawberry.type
class WorkshopQuery:
    @strawberry.field
    def repair_orders(
        self, 
        status: Optional[str] = None, 
        search: Optional[str] = None
    ) -> List[RepairOrderType]:
        qs = RepairOrder.objects.select_related('client', 'device', 'supplier').prefetch_related('parts').all()
        if status:
            qs = qs.filter(status=status)
        if search:
            qs = qs.filter(
                Q(ticket_number__icontains=search) |
                Q(client__full_name__icontains=search) |
                Q(client__phone_primary__icontains=search) |
                Q(device__brand__icontains=search) |
                Q(device__model__icontains=search) |
                Q(device__imei__icontains=search)
            )
        return [RepairOrderType.from_model(o) for o in qs]

    @strawberry.field
    def repair_order(self, ticket_number: str) -> Optional[RepairOrderType]:
        o = RepairOrder.objects.filter(ticket_number=ticket_number).select_related('client', 'device', 'supplier').prefetch_related('parts').first()
        return RepairOrderType.from_model(o) if o else None

    @strawberry.field
    def suppliers(self, search: Optional[str] = None) -> List[SupplierType]:
        qs = Supplier.objects.all().order_by("name")
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(market_place__icontains=search) | Q(contact_name__icontains=search))
        return [SupplierType.from_model(s) for s in qs]

    @strawberry.field
    def abandonment_candidates(self) -> List[RepairOrderType]:
        """Dispositivos en taller con más de 90 días sin retirar ni declarados abandono aún"""
        threshold = timezone.now() - timedelta(days=90)
        qs = RepairOrder.objects.filter(
            created_at__lte=threshold,
            delivered_at__isnull=True,
            is_abandoned=False
        ).select_related('client', 'device')
        return [RepairOrderType.from_model(o) for o in qs]

    @strawberry.field
    def device_brand_presets(self) -> List[BrandPresetType]:
        """Catálogo maestro de marcas y modelos populares en Montero, Santa Cruz"""
        return [
            BrandPresetType(brand="Samsung", models=["Galaxy A12", "Galaxy A13", "Galaxy A14", "Galaxy A03 Core", "Galaxy A04", "Galaxy A22", "Galaxy A32", "Galaxy A52", "Galaxy A54", "Galaxy S21", "Galaxy S22", "Galaxy S23"]),
            BrandPresetType(brand="Apple", models=["iPhone 7", "iPhone 8", "iPhone X", "iPhone XR", "iPhone 11", "iPhone 11 Pro", "iPhone 12", "iPhone 12 Pro", "iPhone 13", "iPhone 13 Pro", "iPhone 14", "iPhone 15"]),
            BrandPresetType(brand="Xiaomi", models=["Redmi 9", "Redmi 9A", "Redmi 10", "Redmi 10C", "Redmi 12", "Redmi Note 8", "Redmi Note 9", "Redmi Note 10", "Redmi Note 11", "Redmi Note 12", "Poco X3 Pro", "Poco X5"]),
            BrandPresetType(brand="Motorola", models=["Moto E7", "Moto E20", "Moto E22", "Moto G20", "Moto G22", "Moto G30", "Moto G31", "Moto G52", "Moto G60", "Moto G84"]),
            BrandPresetType(brand="Infinix", models=["Hot 10", "Hot 10 Lite", "Hot 11", "Hot 12", "Hot 20", "Hot 30", "Hot 40", "Smart 6", "Smart 7", "Note 12", "Note 30"]),
            BrandPresetType(brand="Tecno Mobile", models=["Spark 6", "Spark 7", "Spark 8", "Spark 9", "Spark 10", "Spark 20", "Pova 4", "Pova 5", "Camon 19", "Camon 20"]),
            BrandPresetType(brand="Honor", models=["Honor X6", "Honor X7", "Honor X8", "Honor 50", "Honor 70", "Honor 90", "Honor Magic 5 Lite"]),
            BrandPresetType(brand="Huawei", models=["Y6", "Y7", "Y9", "Y9 Prime", "Nova 9", "Nova 10", "P30 Lite", "P40 Lite"]),
            BrandPresetType(brand="Realme", models=["Realme C11", "Realme C21", "Realme C35", "Realme C53", "Realme C55", "Realme 8", "Realme 9"]),
        ]

@strawberry.type
class WorkshopMutation:
    @strawberry.mutation
    def create_supplier(self, input: SupplierInput) -> SupplierType:
        s = Supplier.objects.create(
            name=input.name,
            is_internal=input.is_internal,
            market_place=input.market_place,
            booth_number=input.booth_number,
            address=input.address,
            contact_name=input.contact_name,
            phone_reference=input.phone_reference,
            notes=input.notes
        )
        return SupplierType.from_model(s)

    @strawberry.mutation
    def update_supplier(self, id: int, input: SupplierInput) -> Optional[SupplierType]:
        supplier = Supplier.objects.filter(id=id).first()
        if not supplier:
            return None
        supplier.name = input.name
        supplier.is_internal = input.is_internal
        supplier.market_place = input.market_place
        supplier.booth_number = input.booth_number
        supplier.address = input.address
        supplier.contact_name = input.contact_name
        supplier.phone_reference = input.phone_reference
        supplier.notes = input.notes
        supplier.save()
        return SupplierType.from_model(supplier)

    @strawberry.mutation
    def delete_supplier(self, id: int) -> bool:
        supplier = Supplier.objects.filter(id=id).first()
        if not supplier:
            return False
        supplier.delete()
        return True

    @strawberry.mutation
    def create_repair_order(self, input: CreateRepairOrderInput) -> RepairOrderType:
        client = Client.objects.get(id=input.client_id)
        
        with transaction.atomic():
            device = Device.objects.create(
                brand=input.brand,
                model=input.model,
                color=input.color,
                imei=input.imei,
                passcode=input.passcode,
                physical_condition=input.physical_condition
            )

            # Ticket correlativo: PF-YYYYMM-XXXX
            now = timezone.now()
            prefix = f"PF-{now.strftime('%y%m')}"
            count_month = RepairOrder.objects.filter(ticket_number__startswith=prefix).count() + 1
            ticket_number = f"{prefix}-{count_month:04d}"

            deposit_cash = Decimal(str(input.deposit_cash))
            deposit_qr = Decimal(str(input.deposit_qr))
            has_deposit = (deposit_cash + deposit_qr) > 0
            deposit_date = now if has_deposit else None

            promise_date = None
            if input.delivery_promise_date:
                try:
                    promise_date = datetime.strptime(input.delivery_promise_date, "%Y-%m-%d").date()
                except Exception:
                    pass

            order = RepairOrder.objects.create(
                ticket_number=ticket_number,
                client=client,
                device=device,
                issue_description=input.issue_description,
                authorized_work=input.authorized_work or "",
                estimated_total=Decimal(str(input.estimated_total)),
                deposit_cash=deposit_cash,
                deposit_qr=deposit_qr,
                deposit_date=deposit_date,
                delivery_promise_date=promise_date,
                initial_photo_key=input.initial_photo_key,
                warranty=RepairOrder.WarrantyPeriod.THREE_WEEKS
            )

        return RepairOrderType.from_model(order)

    @strawberry.mutation
    def update_repair_status(
        self,
        ticket_number: str,
        status: str,
        technician_notes: Optional[str] = None,
        authorized_work: Optional[str] = None,
        tech_observations: Optional[str] = None
    ) -> Optional[RepairOrderType]:
        order = RepairOrder.objects.filter(ticket_number=ticket_number).first()
        if not order:
            return None
        
        if order.status in [RepairOrder.Status.ENTREGADO_REPARADO, RepairOrder.Status.ENTREGADO_SIN_REPARAR, RepairOrder.Status.DECLARADO_ABANDONO]:
            raise PermissionError("Esta orden ya ha sido entregada y cerrada. Los datos de reparación son inmutables.")

        order.status = status
        if technician_notes is not None:
            order.technician_notes = technician_notes
        if authorized_work is not None:
            order.authorized_work = authorized_work
        if tech_observations is not None:
            order.tech_observations = tech_observations
        order.save()
        return RepairOrderType.from_model(order)

    @strawberry.mutation
    def add_repair_part(self, input: AddRepairPartInput) -> RepairPartItemType:
        order = RepairOrder.objects.get(ticket_number=input.ticket_number)
        if order.status in [RepairOrder.Status.ENTREGADO_REPARADO, RepairOrder.Status.ENTREGADO_SIN_REPARAR, RepairOrder.Status.DECLARADO_ABANDONO]:
            raise PermissionError("Esta orden ya ha sido entregada y cerrada. No se pueden agregar repuestos adicionales.")

        product = Product.objects.filter(id=input.product_id).first() if input.product_id else None
        supplier = Supplier.objects.filter(id=input.supplier_id).first() if input.supplier_id else None

        with transaction.atomic():
            part = RepairPartItem.objects.create(
                repair_order=order,
                source_type=input.source_type,
                product=product,
                name=input.name or (product.name if product else "Pieza"),
                cost=Decimal(str(input.cost)),
                price=Decimal(str(input.price)),
                supplier=supplier,
                is_paid=input.is_paid
            )

            # Si es stock interno y se descuenta
            if product and input.source_type == RepairPartItem.SourceType.INTERNAL and product.is_stock_managed:
                product.stock = max(0, product.stock - 1)
                product.save()

            # Recalcular costo de caja chica de la orden
            total_parts_cost = sum(p.cost for p in order.parts.all())
            order.cost_cash_out = total_parts_cost
            order.profit = order.calculate_profit()
            order.save()

        return RepairPartItemType.from_model(part)

    @strawberry.mutation
    def deliver_repair_order(
        self,
        ticket_number: str,
        final_payment_cash: float,
        final_payment_qr: float,
        is_fixed: bool = True,
        warranty: Optional[str] = "3_SEMANAS",
        warranty_custom_notes: Optional[str] = None
    ) -> Optional[RepairOrderType]:
        order = RepairOrder.objects.filter(ticket_number=ticket_number).first()
        if not order:
            return None

        with transaction.atomic():
            order.final_payment_cash = Decimal(str(final_payment_cash))
            order.final_payment_qr = Decimal(str(final_payment_qr))
            
            if is_fixed:
                order.status = RepairOrder.Status.ENTREGADO_REPARADO
                if warranty:
                    order.warranty = warranty
                if warranty_custom_notes:
                    order.warranty_custom_notes = warranty_custom_notes
            else:
                order.status = RepairOrder.Status.ENTREGADO_SIN_REPARAR
                order.warranty = RepairOrder.WarrantyPeriod.NO_WARRANTY

            order.set_delivered()

        return RepairOrderType.from_model(order)

    @strawberry.mutation
    def refund_repair_deposit(
        self,
        ticket_number: str,
        refund_cash: float,
        reason: Optional[str] = None
    ) -> Optional[RepairOrderType]:
        order = RepairOrder.objects.filter(ticket_number=ticket_number).first()
        if not order:
            return None

        order.deposit_refunded = Decimal(str(refund_cash))
        order.status = RepairOrder.Status.ENTREGADO_SIN_REPARAR
        order.delivered_at = timezone.now()
        if reason:
            order.tech_observations = f"Devolución seña: {reason}"
        order.profit = order.calculate_profit()
        order.save()
        return RepairOrderType.from_model(order)

    @strawberry.mutation
    def declare_repair_abandonment(
        self,
        info: strawberry.Info,
        ticket_number: str,
        sale_price: Optional[float] = None
    ) -> Optional[RepairOrderType]:
        """Exclusivo ADMIN: Absorbe el equipo abandonado (> 3 meses) como activo para venta"""
        request = info.context.request
        user = get_user_from_jwt(request)
        if not user or not user.is_admin():
            raise PermissionError("Solo el Administrador puede declarar abandono y absorber equipos.")

        order = RepairOrder.objects.filter(ticket_number=ticket_number).first()
        if not order:
            return None

        order.status = RepairOrder.Status.DECLARADO_ABANDONO
        order.is_abandoned = True
        order.abandoned_at = timezone.now()
        order.abandoned_authorized_by = user
        if sale_price is not None:
            order.abandonment_sale_price = Decimal(str(sale_price))
        order.save()
        return RepairOrderType.from_model(order)

    @strawberry.mutation
    def update_repair_quote(
        self,
        ticket_number: str,
        estimated_total: float,
        technician_notes: Optional[str] = None,
        authorized_work: Optional[str] = None,
        tech_observations: Optional[str] = None,
        delivery_promise_date: Optional[str] = None,
        status: Optional[str] = None
    ) -> Optional[RepairOrderType]:
        """Permite fijar o actualizar el presupuesto cotizado, fecha prometida y notas internas tras el diagnóstico"""
        order = RepairOrder.objects.filter(ticket_number=ticket_number).select_related('client', 'device', 'supplier').prefetch_related('parts').first()
        if not order:
            return None

        if order.status in [RepairOrder.Status.ENTREGADO_REPARADO, RepairOrder.Status.ENTREGADO_SIN_REPARAR, RepairOrder.Status.DECLARADO_ABANDONO]:
            raise PermissionError("Esta orden ya ha sido entregada y cerrada. Los datos de reparación son inmutables.")

        order.estimated_total = Decimal(str(estimated_total))
        if technician_notes is not None:
            order.technician_notes = technician_notes
        if authorized_work is not None:
            order.authorized_work = authorized_work
        if tech_observations is not None:
            order.tech_observations = tech_observations
        if delivery_promise_date is not None:
            if delivery_promise_date.strip():
                try:
                    order.delivery_promise_date = datetime.strptime(delivery_promise_date.strip(), "%Y-%m-%d").date()
                except Exception:
                    pass
            else:
                order.delivery_promise_date = None
        if status:
            order.status = status
        order.save()
        return RepairOrderType.from_model(order)

    @strawberry.mutation
    def generate_repair_invoice(self, ticket_number: str) -> Optional[RepairOrderType]:
        """Genera comprobante oficial con logo PhoneFix, sube a MinIO y actualiza la orden"""
        order = RepairOrder.objects.filter(ticket_number=ticket_number).select_related('client', 'device', 'supplier').prefetch_related('parts').first()
        if not order:
            return None

        generate_repair_invoice_pdf(order)
        order.refresh_from_db()
        return RepairOrderType.from_model(order)
