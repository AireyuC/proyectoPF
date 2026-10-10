import jwt
import datetime
from django.conf import settings
import strawberry
from django.contrib.auth import authenticate

@strawberry.type
class AuthPayload:
    token: str
    user_id: int
    role: str
    permissions: list[str]

@strawberry.type
class AuthMutation:
    @strawberry.mutation
    def login(self, username: str, password: str) -> AuthPayload | None:
        user = authenticate(username=username, password=password)
        if user is None:
            return None
        
        user_role = user.role_ref.name if getattr(user, 'role_ref', None) else getattr(user, 'role', 'STAFF')
        perms = user.get_all_permission_codes() if hasattr(user, 'get_all_permission_codes') else []

        # Generate JWT token
        payload = {
            'user_id': user.id,
            'role': user_role,
            'permissions': perms,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=settings.JWT_EXPIRATION_DELTA_DAYS),
            'iat': datetime.datetime.utcnow()
        }
        
        token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        
        return AuthPayload(
            token=token,
            user_id=user.id,
            role=user_role,
            permissions=perms
        )

def get_user_from_jwt(request):
    auth_header = request.META.get('HTTP_AUTHORIZATION')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        from staff.models import User
        return User.objects.get(id=payload['user_id'])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, Exception):
        return None
