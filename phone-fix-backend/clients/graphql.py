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
    repairs_count: int = 0
    is_recurrent: bool = False

    @classmethod
    def from_model(cls, c: Client) -> "ClientType":
        rep_count = c.repairs.count() if hasattr(c, 'repairs') else 0
        return cls(
            id=c.id,
            full_name=c.full_name,
            ci=c.ci,
            phone_primary=c.phone_primary,
            phone_reference=c.phone_reference,
            email=c.email,
            is_vip=c.is_vip,
            notes=c.notes,
            created_at=c.created_at.isoformat() if c.created_at else "",
            repairs_count=rep_count,
            is_recurrent=(rep_count >= 2)
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
        qs = Client.objects.prefetch_related('repairs').all().order_by("-created_at")
        if search:
            qs = qs.filter(
                Q(full_name__icontains=search) | 
                Q(phone_primary__icontains=search) |
                Q(ci__icontains=search)
            )
        return [ClientType.from_model(c) for c in qs]

    @strawberry.field
    def client(self, id: int) -> Optional[ClientType]:
        c = Client.objects.prefetch_related('repairs').filter(id=id).first()
        return ClientType.from_model(c) if c else None

@strawberry.type
class ClientMutation:
    @strawberry.mutation
    def create_client(self, input: ClientInput) -> ClientType:
        # 1. Comprobar si ya existe cliente por C.I.
        if input.ci and input.ci.strip():
            existing = Client.objects.filter(ci__iexact=input.ci.strip()).first()
            if existing:
                if input.full_name and input.full_name.strip():
                    existing.full_name = input.full_name.strip()
                if input.phone_primary and input.phone_primary.strip():
                    existing.phone_primary = input.phone_primary.strip()
                if input.phone_reference:
                    existing.phone_reference = input.phone_reference
                if input.email:
                    existing.email = input.email
                if input.notes:
                    existing.notes = f"{existing.notes}\n{input.notes}" if existing.notes else input.notes
                if input.is_vip:
                    existing.is_vip = True
                existing.save()
                return ClientType.from_model(existing)

        # 2. Si no tiene CI pero coincide el celular principal exactamente
        if input.phone_primary and input.phone_primary.strip():
            existing = Client.objects.filter(phone_primary=input.phone_primary.strip()).first()
            if existing:
                if input.ci and input.ci.strip():
                    existing.ci = input.ci.strip()
                if input.full_name and input.full_name.strip():
                    existing.full_name = input.full_name.strip()
                if input.phone_reference:
                    existing.phone_reference = input.phone_reference
                if input.is_vip:
                    existing.is_vip = True
                existing.save()
                return ClientType.from_model(existing)

        # 3. Crear nuevo cliente
        c = Client.objects.create(
            full_name=input.full_name.strip(),
            phone_primary=input.phone_primary.strip(),
            ci=input.ci.strip() if input.ci else None,
            phone_reference=input.phone_reference.strip() if input.phone_reference else None,
            email=input.email.strip() if input.email else None,
            is_vip=input.is_vip,
            notes=input.notes.strip() if input.notes else None
        )
        return ClientType.from_model(c)

    @strawberry.mutation
    def update_client(self, id: int, input: ClientInput) -> Optional[ClientType]:
        c = Client.objects.filter(id=id).first()
        if not c:
            return None
        c.full_name = input.full_name.strip()
        c.phone_primary = input.phone_primary.strip()
        c.ci = input.ci.strip() if input.ci else None
        c.phone_reference = input.phone_reference.strip() if input.phone_reference else None
        c.email = input.email.strip() if input.email else None
        c.is_vip = input.is_vip
        c.notes = input.notes.strip() if input.notes else None
        c.save()
        return ClientType.from_model(c)
