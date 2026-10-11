import strawberry
from typing import Optional, List
from decimal import Decimal
from datetime import datetime, date, timedelta
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum, Q
from .models import Sale, SaleItem, CashClose
from inventory.models import Product
from workshop.models import RepairOrder, RepairPartItem
from core.auth_graphql import get_user_from_jwt

def parse_date_range(start_str: Optional[str], end_str: Optional[str]):
    now = timezone.now()
    if start_str:
        try:
            start_d = datetime.strptime(start_str.strip(), "%Y-%m-%d").date()
            start_dt = timezone.make_aware(datetime.combine(start_d, datetime.min.time()))
        except Exception:
            start_dt = now - timedelta(days=30)
    else:
        start_dt = now - timedelta(days=30)

    if end_str:
        try:
            end_d = datetime.strptime(end_str.strip(), "%Y-%m-%d").date()
            end_dt = timezone.make_aware(datetime.combine(end_d, datetime.max.time()))
        except Exception:
            end_dt = now
    else:
        end_dt = now
    return start_dt, end_dt

@strawberry.type
class LedgerEntryType:
    id: str
    timestamp: str
    entry_type: str
    concept: str
    reference_code: str
    cash_in: float
    qr_in: float
    cash_out: float
    net_amount: float
    user_or_tech: str
    notes: Optional[str] = None

@strawberry.type
class LedgerSummaryType:
    total_cash_in: float
    total_qr_in: float
    total_cash_out: float
    total_revenue: float
    net_profit: float
    total_entries_count: int

@strawberry.type
class AccountingLedgerType:
    start_date: str
    end_date: str
    summary: LedgerSummaryType
    entries: List[LedgerEntryType]

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

    @strawberry.field
    def accounting_ledger(
        self,
        info: strawberry.Info,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> AccountingLedgerType:
        """Libro Contable General Inmutable: Consolida ingresos y egresos de mostrador y taller"""
        request = info.context.request
        user = get_user_from_jwt(request)
        if not user or not (user.is_admin() or user.has_perm_code("caja.movimientos.ver")):
            raise PermissionError("Acceso denegado: Se requiere rol de Administrador para auditar el Libro Contable General.")

        start_dt, end_dt = parse_date_range(start_date, end_date)
        entries: List[LedgerEntryType] = []

        # 1. Ventas de Mostrador (Sale)
        sales_qs = Sale.objects.filter(
            created_at__gte=start_dt,
            created_at__lte=end_dt
        ).select_related('user').prefetch_related('items')

        for s in sales_qs:
            c_in = float(s.payment_cash)
            q_in = float(s.payment_qr)
            entries.append(LedgerEntryType(
                id=f"SALE-{s.id}",
                timestamp=s.created_at.isoformat(),
                entry_type="VENTA_MOSTRADOR",
                concept=f"Venta de Mostrador POS #{s.id}",
                reference_code=f"VTA-{s.id}",
                cash_in=c_in,
                qr_in=q_in,
                cash_out=0.0,
                net_amount=c_in + q_in,
                user_or_tech=s.user.username if s.user else "Cajero",
                notes=f"{s.items.count()} producto(s)"
            ))

        # 2. Señas de Taller (RepairOrder)
        deposits_qs = RepairOrder.objects.filter(
            Q(deposit_date__gte=start_dt, deposit_date__lte=end_dt) |
            Q(deposit_date__isnull=True, created_at__gte=start_dt, created_at__lte=end_dt)
        ).filter(
            Q(deposit_cash__gt=0) | Q(deposit_qr__gt=0)
        ).select_related('client', 'device')

        for r in deposits_qs:
            ts = r.deposit_date if r.deposit_date else r.created_at
            c_in = float(r.deposit_cash)
            q_in = float(r.deposit_qr)
            entries.append(LedgerEntryType(
                id=f"REP-DEP-{r.ticket_number}",
                timestamp=ts.isoformat(),
                entry_type="SEÑA_TALLER",
                concept=f"Seña Inicial - Orden {r.ticket_number} ({r.device.brand} {r.device.model} - {r.client.full_name})",
                reference_code=r.ticket_number,
                cash_in=c_in,
                qr_in=q_in,
                cash_out=0.0,
                net_amount=c_in + q_in,
                user_or_tech="Recepción",
                notes=r.issue_description
            ))

        # 3. Liquidaciones Finales de Taller (RepairOrder entregadas)
        deliveries_qs = RepairOrder.objects.filter(
            delivered_at__gte=start_dt,
            delivered_at__lte=end_dt
        ).filter(
            Q(final_payment_cash__gt=0) | Q(final_payment_qr__gt=0)
        ).select_related('client', 'device')

        for r in deliveries_qs:
            c_in = float(r.final_payment_cash)
            q_in = float(r.final_payment_qr)
            entries.append(LedgerEntryType(
                id=f"REP-FIN-{r.ticket_number}",
                timestamp=r.delivered_at.isoformat(),
                entry_type="ENTREGA_TALLER",
                concept=f"Liquidación Final - Orden {r.ticket_number} ({r.device.brand} {r.device.model} - {r.client.full_name})",
                reference_code=r.ticket_number,
                cash_in=c_in,
                qr_in=q_in,
                cash_out=0.0,
                net_amount=c_in + q_in,
                user_or_tech="Taller / Entrega",
                notes=r.technician_notes or "Entrega final de equipo reparado"
            ))

        # 4. Compras de Repuestos a Casetas / Proveedores Externos
        parts_qs = RepairPartItem.objects.filter(
            source_type=RepairPartItem.SourceType.EXTERNAL,
            cost__gt=0,
            repair_order__created_at__gte=start_dt,
            repair_order__created_at__lte=end_dt
        ).select_related('repair_order', 'supplier')

        for p in parts_qs:
            c_out = float(p.cost)
            entries.append(LedgerEntryType(
                id=f"REP-PART-{p.id}",
                timestamp=p.repair_order.created_at.isoformat(),
                entry_type="COMPRA_REPUESTO_CASETA",
                concept=f"Compra Repuesto: {p.name} (Orden {p.repair_order.ticket_number})",
                reference_code=p.repair_order.ticket_number,
                cash_in=0.0,
                qr_in=0.0,
                cash_out=c_out,
                net_amount=-c_out,
                user_or_tech=p.supplier.name if p.supplier else "Caseta Externa",
                notes=f"Proveedor: {p.supplier.name if p.supplier else 'Caseta local'} - Pagado: {'Sí' if p.is_paid else 'Pendiente'}"
            ))

        # 5. Devoluciones de Señas
        refunds_qs = RepairOrder.objects.filter(
            delivered_at__gte=start_dt,
            delivered_at__lte=end_dt,
            deposit_refunded__gt=0
        ).select_related('client', 'device')

        for r in refunds_qs:
            c_out = float(r.deposit_refunded)
            entries.append(LedgerEntryType(
                id=f"REP-REF-{r.ticket_number}",
                timestamp=r.delivered_at.isoformat(),
                entry_type="DEVOLUCION_SEÑA",
                concept=f"Devolución de Seña - Orden {r.ticket_number} ({r.client.full_name})",
                reference_code=r.ticket_number,
                cash_in=0.0,
                qr_in=0.0,
                cash_out=c_out,
                net_amount=-c_out,
                user_or_tech="Caja / Recepción",
                notes=r.tech_observations or "Devolución por no aceptación o falta de repuesto"
            ))

        # Ordenar por timestamp descendente
        entries.sort(key=lambda e: e.timestamp, reverse=True)

        tot_cash_in = sum(e.cash_in for e in entries)
        tot_qr_in = sum(e.qr_in for e in entries)
        tot_cash_out = sum(e.cash_out for e in entries)
        tot_revenue = tot_cash_in + tot_qr_in
        net_prof = tot_revenue - tot_cash_out

        summary = LedgerSummaryType(
            total_cash_in=tot_cash_in,
            total_qr_in=tot_qr_in,
            total_cash_out=tot_cash_out,
            total_revenue=tot_revenue,
            net_profit=net_prof,
            total_entries_count=len(entries)
        )

        return AccountingLedgerType(
            start_date=start_dt.date().isoformat(),
            end_date=end_dt.date().isoformat(),
            summary=summary,
            entries=entries
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
