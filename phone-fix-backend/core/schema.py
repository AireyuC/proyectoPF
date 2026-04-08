import strawberry

@strawberry.type
class Query:
    @strawberry.field
    def hello(self) -> str:
        return "Conexión a GraphQL exitosa (Phone Fix)"

schema = strawberry.Schema(query=Query)
