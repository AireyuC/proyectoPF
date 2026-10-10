import strawberry
from typing import Optional, List
from django.db.models import Q
from .models import Client

@strawberry.type
class ClientType:
    id: int
    full_name: str
    ci: Optional[str]
    phone_primary: str
    phone_reference: Optional[str]
    email: Optional[str]
    is_vip: bool
    notes: Optional[str]
    created_at: str

    @classmethod
    def from_model(cls, c: Client) -> "ClientType":
        return cls(
            id=c.id,
            full_name=c.full_name,
            ci=c.ci,
            phone_primary=c.phone_primary,
            phone_reference=c.phone_reference,
            email=c.email,
            is_vip=c.is_vip,
            notes=c.notes,
            created_at=c.created_at.isoformat() if c.created_at else ""
        )

@strawberry.input
class ClientInput:
    full_name: str
    phone_primary: str
    ci: Optional[str] = None
    phone_reference: Optional[str] = None
    email: Optional[str] = None
    is_vip: bool = False
    notes: Optional[str] = None

@strawberry.type
class ClientQuery:
    @strawberry.field
    def clients(self, search: Optional[str] = None) -> List[ClientType]:
        qs = Client.objects.all().order_by("-created_at")
        if search:
            qs = qs.filter(
                models.Q(full_name__icontains=search) | 
                models.Q(phone_primary__icontains=search) |
                models.Q(ci__icontains=search)
            )
        return [ClientType.from_model(c) for c in qs]

    @strawberry.field
    def client(self, id: int) -> Optional[ClientType]:
        c = Client.objects.filter(id=id).first()
        return ClientType.from_model(c) if c else None

@strawberry.type
class ClientMutation:
    @strawberry.mutation
    def create_client(self, input: ClientInput) -> ClientType:
        c = Client.objects.create(
            full_name=input.full_name,
            phone_primary=input.phone_primary,
            ci=input.ci,
            phone_reference=input.phone_reference,
            email=input.email,
            is_vip=input.is_vip,
            notes=input.notes
        )
        return ClientType.from_model(c)

    @strawberry.mutation
    def update_client(self, id: int, input: ClientInput) -> Optional[ClientType]:
        c = Client.objects.filter(id=id).first()
        if not c:
            return None
        c.full_name = input.full_name
        c.phone_primary = input.phone_primary
        c.ci = input.ci
        c.phone_reference = input.phone_reference
        c.email = input.email
        c.is_vip = input.is_vip
        c.notes = input.notes
        c.save()
        return ClientType.from_model(c)
