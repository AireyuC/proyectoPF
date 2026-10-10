import strawberry
from .auth_graphql import AuthMutation
from staff.graphql import StaffQuery, StaffMutation
from clients.graphql import ClientQuery, ClientMutation
from inventory.graphql import InventoryQuery, InventoryMutation
from workshop.graphql import WorkshopQuery, WorkshopMutation
from sales.graphql import SalesQuery, SalesMutation

@strawberry.type
class Query(
    StaffQuery,
    ClientQuery,
    InventoryQuery,
    WorkshopQuery,
    SalesQuery
):
    @strawberry.field
    def hello(self) -> str:
        return "PhoneFix API GraphQL operativa"

@strawberry.type
class Mutation(
    AuthMutation,
    StaffMutation,
    ClientMutation,
    InventoryMutation,
    WorkshopMutation,
    SalesMutation
):
    pass

schema = strawberry.Schema(query=Query, mutation=Mutation)
