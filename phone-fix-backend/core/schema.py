import strawberry
from .auth_graphql import AuthMutation

@strawberry.type
class Query:
    @strawberry.field
    def hello(self) -> str:
        return "Conexión a GraphQL exitosa (Phone Fix)"

@strawberry.type
class Mutation(AuthMutation):
    pass

schema = strawberry.Schema(query=Query, mutation=Mutation)
