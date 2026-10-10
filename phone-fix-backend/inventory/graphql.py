import strawberry
from typing import Optional, List
from decimal import Decimal
from django.db.models import Q, F
from .models import Product

@strawberry.type
class ProductType:
    id: int
    name: str
    category: str
    cost_price: float
    sale_price: float
    is_stock_managed: bool
    stock: int
    min_stock: int
    location: Optional[str]
    is_low_stock: bool
    created_at: str
    updated_at: str

    @classmethod
    def from_model(cls, p: Product) -> "ProductType":
        return cls(
            id=p.id,
            name=p.name,
            category=p.category,
            cost_price=float(p.cost_price),
            sale_price=float(p.sale_price),
            is_stock_managed=p.is_stock_managed,
            stock=p.stock,
            min_stock=p.min_stock,
            location=p.location,
            is_low_stock=p.is_low_stock,
            created_at=p.created_at.isoformat() if p.created_at else "",
            updated_at=p.updated_at.isoformat() if p.updated_at else "",
        )

@strawberry.input
class ProductInput:
    name: str
    category: str = "ACCESORIO"
    cost_price: float = 0.0
    sale_price: float = 0.0
    is_stock_managed: bool = False
    stock: int = 0
    min_stock: int = 2
    location: Optional[str] = None

@strawberry.type
class InventoryQuery:
    @strawberry.field
    def products(
        self, 
        search: Optional[str] = None, 
        category: Optional[str] = None,
        low_stock_only: Optional[bool] = False
    ) -> List[ProductType]:
        qs = Product.objects.all().order_by("name")
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(location__icontains=search))
        if category:
            qs = qs.filter(category=category)
        if low_stock_only:
            qs = qs.filter(is_stock_managed=True, stock__lte=models.F('min_stock'))
        return [ProductType.from_model(p) for p in qs]

    @strawberry.field
    def product(self, id: int) -> Optional[ProductType]:
        p = Product.objects.filter(id=id).first()
        return ProductType.from_model(p) if p else None

@strawberry.type
class InventoryMutation:
    @strawberry.mutation
    def create_product(self, input: ProductInput) -> ProductType:
        p = Product.objects.create(
            name=input.name,
            category=input.category,
            cost_price=Decimal(str(input.cost_price)),
            sale_price=Decimal(str(input.sale_price)),
            is_stock_managed=input.is_stock_managed,
            stock=input.stock,
            min_stock=input.min_stock,
            location=input.location
        )
        return ProductType.from_model(p)

    @strawberry.mutation
    def update_product(self, id: int, input: ProductInput) -> Optional[ProductType]:
        p = Product.objects.filter(id=id).first()
        if not p:
            return None
        p.name = input.name
        p.category = input.category
        p.cost_price = Decimal(str(input.cost_price))
        p.sale_price = Decimal(str(input.sale_price))
        p.is_stock_managed = input.is_stock_managed
        p.stock = input.stock
        p.min_stock = input.min_stock
        p.location = input.location
        p.save()
        return ProductType.from_model(p)

    @strawberry.mutation
    def adjust_stock(self, id: int, quantity_delta: int) -> Optional[ProductType]:
        p = Product.objects.filter(id=id).first()
        if not p:
            return None
        p.stock += quantity_delta
        p.save()
        return ProductType.from_model(p)
