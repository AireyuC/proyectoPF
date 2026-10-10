import strawberry
from typing import Optional, List
from django.db import transaction
from .models import User, Role, Permission, RolePermission
from core.auth_graphql import get_user_from_jwt

@strawberry.type
class PermissionType:
    id: int
    code: str
    name: str
    description: str
    module: str

    @classmethod
    def from_model(cls, p: Permission) -> "PermissionType":
        return cls(
            id=p.id,
            code=p.code,
            name=p.name,
            description=p.description,
            module=p.module
        )

@strawberry.type
class RoleType:
    id: int
    name: str
    description: str
    is_protected: bool
    permissions: List[str]

    @classmethod
    def from_model(cls, r: Role) -> "RoleType":
        perms = list(Permission.objects.filter(role_permissions__role=r).values_list('code', flat=True))
        return cls(
            id=r.id,
            name=r.name,
            description=r.description,
            is_protected=r.is_protected,
            permissions=perms
        )

@strawberry.type
class UserType:
    id: int
    username: str
    first_name: str
    last_name: str
    email: str
    role_display: str
    role_id: Optional[int]
    is_admin: bool
    permissions: List[str]

    @classmethod
    def from_model(cls, u: User) -> "UserType":
        r_name = u.role_ref.name if u.role_ref else u.get_role_display()
        return cls(
            id=u.id,
            username=u.username,
            first_name=u.first_name,
            last_name=u.last_name,
            email=u.email,
            role_display=r_name,
            role_id=u.role_ref.id if u.role_ref else None,
            is_admin=u.is_admin(),
            permissions=u.get_all_permission_codes()
        )

@strawberry.type
class StaffQuery:
    @strawberry.field
    def me(self, info: strawberry.Info) -> Optional[UserType]:
        request = info.context.request
        u = get_user_from_jwt(request)
        return UserType.from_model(u) if u else None

    @strawberry.field
    def users(self) -> List[UserType]:
        return [UserType.from_model(u) for u in User.objects.all().order_by("username")]

    @strawberry.field
    def roles(self) -> List[RoleType]:
        return [RoleType.from_model(r) for r in Role.objects.all().order_by("name")]

    @strawberry.field
    def permissions(self) -> List[PermissionType]:
        return [PermissionType.from_model(p) for p in Permission.objects.all().order_by("module", "code")]

@strawberry.type
class StaffMutation:
    @strawberry.mutation
    def assign_user_role(self, user_id: int, role_id: int) -> Optional[UserType]:
        user = User.objects.filter(id=user_id).first()
        role = Role.objects.filter(id=role_id).first()
        if not user or not role:
            return None
        user.role_ref = role
        user.save()
        return UserType.from_model(user)

    @strawberry.mutation
    def sync_role_permissions(self, role_id: int, permission_codes: List[str]) -> Optional[RoleType]:
        role = Role.objects.filter(id=role_id).first()
        if not role:
            return None

        with transaction.atomic():
            RolePermission.objects.filter(role=role).delete()
            perms = Permission.objects.filter(code__in=permission_codes)
            for p in perms:
                RolePermission.objects.create(role=role, permission=p)

        return RoleType.from_model(role)
