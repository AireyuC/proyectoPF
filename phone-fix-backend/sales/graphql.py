import strawberry
from typing import Optional, List
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum, Q
from .models import Sale, SaleItem, CashClose
from inventory.models import Product
from workshop.models import RepairOrder
from core.auth_graphql import get_user_from_jwt

@strawberry.type
class SaleItemType:
    id: int
    item_name: str
    is_manual_entry: bool
    custom_name: Optional[str]
    quantity: int
    unit_price: float
    unit_cost: float
    subtotal: float

    @classmethod
    def from_model(cls, it: SaleItem) -> "SaleItemType":
        return cls(
            id=it.id,
            item_name=it.item_name,
            is_manual_entry=it.is_manual_entry,
            custom_name=it.custom_name,
            quantity=it.quantity,
            unit_price=float(it.unit_price),
            unit_cost=float(it.unit_cost),
            subtotal=float(it.subtotal)
        )

@strawberry.type
class SaleType:
    id: int
    user_name: str
    payment_cash: float
    payment_qr: float
    total: float
    receipt_minio_key: Optional[str]
    created_at: str
    items: List[SaleItemType]

    @classmethod
    def from_model(cls, s: Sale) -> "SaleType":
        return cls(
            id=s.id,
            user_name=s.user.username if s.user else "Anónimo",
            payment_cash=float(s.payment_cash),
            payment_qr=float(s.payment_qr),
            total=float(s.total),
            receipt_minio_key=s.receipt_minio_key,
            created_at=s.created_at.isoformat() if s.created_at else "",
            items=[SaleItemType.from_model(it) for it in s.items.all()]
        )

@strawberry.type
class CashCloseType:
    id: int
    date: str
    initial_cash: float
    sales_cash: float
    sales_qr: float
    repairs_cash: float
    repairs_qr: float
    expenses_cash: float
    deposit_refunds_cash: float
    expected_cash: float
    actual_cash: float
    difference: float
    expected_qr_total: float
    receipt_minio_key: Optional[str]
    closed_by_name: str
    created_at: str

    @classmethod
    def from_model(cls, c: CashClose) -> "CashCloseType":
        return cls(
            id=c.id,
            date=c.date.isoformat() if c.date else "",
            initial_cash=float(c.initial_cash),
            sales_cash=float(c.sales_cash),
            sales_qr=float(c.sales_qr),
            repairs_cash=float(c.repairs_cash),
            repairs_qr=float(c.repairs_qr),
            expenses_cash=float(c.expenses_cash),
            deposit_refunds_cash=float(c.deposit_refunds_cash),
            expected_cash=float(c.expected_cash),
            actual_cash=float(c.actual_cash),
            difference=float(c.difference),
            expected_qr_total=float(c.expected_qr_total),
            receipt_minio_key=c.receipt_minio_key,
            closed_by_name=c.closed_by.username if c.closed_by else "Sistema",
            created_at=c.created_at.isoformat() if c.created_at else ""
        )

@strawberry.type
class DrawerSummaryType:
    date: str
    initial_cash: float
    today_sales_cash: float
    today_sales_qr: float
    today_repairs_cash: float
    today_repairs_qr: float
    today_expenses_cash: float
    today_refunds_cash: float
    expected_drawer_cash: float
    expected_bank_qr: float

@strawberry.input
class SaleItemInput:
    product_id: Optional[int] = None
    is_manual_entry: bool = False
    custom_name: Optional[str] = None
    save_to_catalog: bool = False
    quantity: int = 1
    unit_price: float = 0.0
    unit_cost: float = 0.0

@strawberry.input
class CreateSaleInput:
    payment_cash: float
    payment_qr: float
    items: List[SaleItemInput]
    receipt_minio_key: Optional[str] = None

@strawberry.input
class CreateCashCloseInput:
    initial_cash: float
    actual_cash: float
    expenses_cash: float = 0.0
    receipt_minio_key: Optional[str] = None

@strawberry.type
class SalesQuery:
    @strawberry.field
    def sales(self, limit: Optional[int] = 50) -> List[SaleType]:
        qs = Sale.objects.select_related('user').prefetch_related('items').all().order_by('-created_at')[:limit]
        return [SaleType.from_model(s) for s in qs]

    @strawberry.field
    def cash_closes(self, limit: Optional[int] = 30) -> List[CashCloseType]:
        qs = CashClose.objects.select_related('closed_by').all().order_by('-date')[:limit]
        return [CashCloseType.from_model(c) for c in qs]

    @strawberry.field
    def active_drawer_summary(self, initial_cash: float = 0.0) -> DrawerSummaryType:
        today = timezone.localdate()
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)

        # 1. Ventas del día
        today_sales = Sale.objects.filter(created_at__gte=today_start)
        sales_cash = sum((s.payment_cash for s in today_sales), Decimal('0'))
        sales_qr = sum((s.payment_qr for s in today_sales), Decimal('0'))

        # 2. Taller - Señas ingresadas hoy
        today_repairs_deposits = RepairOrder.objects.filter(deposit_date__gte=today_start)
        deposits_cash = sum((r.deposit_cash for r in today_repairs_deposits), Decimal('0'))
        deposits_qr = sum((r.deposit_qr for r in today_repairs_deposits), Decimal('0'))

        # 3. Taller - Saldos finales cobrados hoy al entregar
        today_deliveries = RepairOrder.objects.filter(delivered_at__gte=today_start)
        deliveries_cash = sum((r.final_payment_cash for r in today_deliveries), Decimal('0'))
        deliveries_qr = sum((r.final_payment_qr for r in today_deliveries), Decimal('0'))
        
        # 4. Taller - Devoluciones de seña hoy
        refunds_cash = sum((r.deposit_refunded for r in today_deliveries if r.deposit_refunded > 0), Decimal('0'))

        total_repairs_cash = deposits_cash + deliveries_cash
        total_repairs_qr = deposits_qr + deliveries_qr

        init_decimal = Decimal(str(initial_cash))
        expected_cash = (init_decimal + sales_cash + total_repairs_cash) - refunds_cash
        expected_qr = sales_qr + total_repairs_qr

        return DrawerSummaryType(
            date=today.isoformat(),
            initial_cash=float(init_decimal),
            today_sales_cash=float(sales_cash),
            today_sales_qr=float(sales_qr),
            today_repairs_cash=float(total_repairs_cash),
            today_repairs_qr=float(total_repairs_qr),
            today_expenses_cash=0.0,
            today_refunds_cash=float(refunds_cash),
            expected_drawer_cash=float(expected_cash),
            expected_bank_qr=float(expected_qr)
        )

@strawberry.type
class SalesMutation:
    @strawberry.mutation
    def create_sale(self, info: strawberry.Info, input: CreateSaleInput) -> SaleType:
        request = info.context.request
        user = get_user_from_jwt(request)
        if not user:
            from staff.models import User
            user = User.objects.first()

        payment_cash = Decimal(str(input.payment_cash))
        payment_qr = Decimal(str(input.payment_qr))
        total = payment_cash + payment_qr

        with transaction.atomic():
            sale = Sale.objects.create(
                user=user,
                payment_cash=payment_cash,
                payment_qr=payment_qr,
                total=total,
                receipt_minio_key=input.receipt_minio_key
            )

            for item_in in input.items:
                product = None
                if item_in.product_id:
                    product = Product.objects.filter(id=item_in.product_id).first()

                # Venta libre (al aire): Validar si no es admin ni tiene permiso
                if item_in.is_manual_entry:
                    if not (user.is_admin() or user.has_perm_code("ventas.pos.venta_libre")):
                        raise PermissionError("Solo el Administrador tiene permiso para venta libre / fuera de catálogo.")

                    # Poblamiento orgánico del catálogo si se marcó la casilla
                    if item_in.save_to_catalog and item_in.custom_name:
                        product, _ = Product.objects.get_or_create(
                            name=item_in.custom_name,
                            defaults={
                                "sale_price": Decimal(str(item_in.unit_price)),
                                "cost_price": Decimal(str(item_in.unit_cost)),
                                "is_stock_managed": False,
                                "category": Product.Category.ACCESORIO
                            }
                        )

                # Descuento de stock si aplica
                if product and product.is_stock_managed:
                    product.stock = max(0, product.stock - item_in.quantity)
                    product.save()

                SaleItem.objects.create(
                    sale=sale,
                    product=product,
                    is_manual_entry=item_in.is_manual_entry,
                    custom_name=item_in.custom_name,
                    save_to_catalog=item_in.save_to_catalog,
                    quantity=item_in.quantity,
                    unit_price=Decimal(str(item_in.unit_price)),
                    unit_cost=Decimal(str(item_in.unit_cost))
                )

        return SaleType.from_model(sale)

    @strawberry.mutation
    def create_cash_close(self, info: strawberry.Info, input: CreateCashCloseInput) -> CashCloseType:
        request = info.context.request
        user = get_user_from_jwt(request)
        if not user:
            from staff.models import User
            user = User.objects.first()

        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Calcular sumatorias del día
        today_sales = Sale.objects.filter(created_at__gte=today_start)
        sales_cash = sum((s.payment_cash for s in today_sales), Decimal('0'))
        sales_qr = sum((s.payment_qr for s in today_sales), Decimal('0'))

        today_repairs_deposits = RepairOrder.objects.filter(deposit_date__gte=today_start)
        deposits_cash = sum((r.deposit_cash for r in today_repairs_deposits), Decimal('0'))
        deposits_qr = sum((r.deposit_qr for r in today_repairs_deposits), Decimal('0'))

        today_deliveries = RepairOrder.objects.filter(delivered_at__gte=today_start)
        deliveries_cash = sum((r.final_payment_cash for r in today_deliveries), Decimal('0'))
        deliveries_qr = sum((r.final_payment_qr for r in today_deliveries), Decimal('0'))
        refunds_cash = sum((r.deposit_refunded for r in today_deliveries if r.deposit_refunded > 0), Decimal('0'))

        repairs_cash = deposits_cash + deliveries_cash
        repairs_qr = deposits_qr + deliveries_qr

        init_cash = Decimal(str(input.initial_cash))
        actual_cash = Decimal(str(input.actual_cash))
        expenses_cash = Decimal(str(input.expenses_cash))

        close = CashClose(
            initial_cash=init_cash,
            sales_cash=sales_cash,
            sales_qr=sales_qr,
            repairs_cash=repairs_cash,
            repairs_qr=repairs_qr,
            expenses_cash=expenses_cash,
            deposit_refunds_cash=refunds_cash,
            actual_cash=actual_cash,
            expected_qr_total=sales_qr + repairs_qr,
            receipt_minio_key=input.receipt_minio_key,
            closed_by=user
        )
        close.expected_cash = close.calculate_expected_cash()
        close.difference = close.actual_cash - close.expected_cash
        close.save()

        return CashCloseType.from_model(close)
