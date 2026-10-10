import { gql } from '@apollo/client';

// ==========================================
// AUTENTICACIÓN
// ==========================================
export const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      userId
      role
      permissions
    }
  }
`;

// ==========================================
// CLIENTES
// ==========================================
export const GET_CLIENTS = gql`
  query GetClients($search: String) {
    clients(search: $search) {
      id
      fullName
      ci
      phonePrimary
      phoneReference
      email
      isVip
      notes
      createdAt
    }
  }
`;

export const CREATE_CLIENT = gql`
  mutation CreateClient($input: ClientInput!) {
    createClient(input: $input) {
      id
      fullName
      phonePrimary
      ci
      phoneReference
      email
      isVip
    }
  }
`;

// ==========================================
// INVENTARIO / PRODUCTOS
// ==========================================
export const GET_PRODUCTS = gql`
  query GetProducts($search: String, $category: String, $lowStockOnly: Boolean) {
    products(search: $search, category: $category, lowStockOnly: $lowStockOnly) {
      id
      name
      category
      costPrice
      salePrice
      isStockManaged
      stock
      minStock
      location
      isLowStock
    }
  }
`;

export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) {
      id
      name
      category
      salePrice
      costPrice
      isStockManaged
      stock
      location
    }
  }
`;

export const ADJUST_STOCK = gql`
  mutation AdjustStock($id: Int!, $quantityDelta: Int!) {
    adjustStock(id: $id, quantityDelta: $quantityDelta) {
      id
      stock
      isLowStock
    }
  }
`;

// ==========================================
// TALLER & RECEPCIÓN
// ==========================================
export const GET_REPAIR_ORDERS = gql`
  query GetRepairOrders($status: String, $search: String) {
    repairOrders(status: $status, search: $search) {
      id
      ticketNumber
      clientId
      clientName
      clientPhone
      device {
        id
        brand
        model
        color
        imei
        passcode
        physicalCondition
      }
      issueDescription
      technicianNotes
      techObservations
      status
      statusDisplay
      warranty
      warrantyDisplay
      warrantyExpiresAt
      estimatedTotal
      depositCash
      depositQr
      depositRefunded
      depositDate
      finalPaymentCash
      finalPaymentQr
      totalCollected
      remainingBalance
      costCashOut
      profit
      isAbandoned
      abandonedAt
      abandonmentSalePrice
      deliveryPromiseDate
      createdAt
      deliveredAt
      daysInWorkshop
      isAbandonmentEligible
      invoiceNumber
      invoicePdfKey
      invoicePdfUrl
      invoiceGeneratedAt
      parts {
        id
        name
        sourceType
        cost
        price
        isPaid
        supplierName
      }
    }
  }
`;

export const GET_REPAIR_ORDER = gql`
  query GetRepairOrder($ticketNumber: String!) {
    repairOrder(ticketNumber: $ticketNumber) {
      id
      ticketNumber
      clientId
      clientName
      clientPhone
      device {
        id
        brand
        model
        color
        imei
        passcode
        physicalCondition
      }
      issueDescription
      technicianNotes
      techObservations
      status
      statusDisplay
      warranty
      warrantyDisplay
      warrantyExpiresAt
      estimatedTotal
      depositCash
      depositQr
      depositRefunded
      depositDate
      finalPaymentCash
      finalPaymentQr
      totalCollected
      remainingBalance
      costCashOut
      profit
      isAbandoned
      abandonedAt
      abandonmentSalePrice
      deliveryPromiseDate
      createdAt
      deliveredAt
      daysInWorkshop
      isAbandonmentEligible
      invoiceNumber
      invoicePdfKey
      invoicePdfUrl
      invoiceGeneratedAt
      parts {
        id
        name
        sourceType
        cost
        price
        isPaid
        supplierName
      }
    }
  }
`;

export const CREATE_REPAIR_ORDER = gql`
  mutation CreateRepairOrder($input: CreateRepairOrderInput!) {
    createRepairOrder(input: $input) {
      id
      ticketNumber
      status
      statusDisplay
      estimatedTotal
      depositCash
      depositQr
      totalCollected
      remainingBalance
      warranty
    }
  }
`;

export const UPDATE_REPAIR_STATUS = gql`
  mutation UpdateRepairStatus(
    $ticketNumber: String!
    $status: String!
    $technicianNotes: String
    $techObservations: String
  ) {
    updateRepairStatus(
      ticketNumber: $ticketNumber
      status: $status
      technicianNotes: $technicianNotes
      techObservations: $techObservations
    ) {
      id
      ticketNumber
      status
      statusDisplay
      technicianNotes
      techObservations
    }
  }
`;

export const ADD_REPAIR_PART = gql`
  mutation AddRepairPart($input: AddRepairPartInput!) {
    addRepairPart(input: $input) {
      id
      name
      sourceType
      cost
      price
      supplierName
    }
  }
`;

export const DELIVER_REPAIR_ORDER = gql`
  mutation DeliverRepairOrder(
    $ticketNumber: String!
    $finalPaymentCash: Float!
    $finalPaymentQr: Float!
    $isFixed: Boolean!
    $warranty: String
    $warrantyCustomNotes: String
  ) {
    deliverRepairOrder(
      ticketNumber: $ticketNumber
      finalPaymentCash: $finalPaymentCash
      finalPaymentQr: $finalPaymentQr
      isFixed: $isFixed
      warranty: $warranty
      warrantyCustomNotes: $warrantyCustomNotes
    ) {
      id
      ticketNumber
      status
      statusDisplay
      warranty
      warrantyExpiresAt
      totalCollected
      remainingBalance
      profit
      deliveredAt
    }
  }
`;

export const REFUND_REPAIR_DEPOSIT = gql`
  mutation RefundRepairDeposit($ticketNumber: String!, $refundCash: Float!, $reason: String) {
    refundRepairDeposit(ticketNumber: $ticketNumber, refundCash: $refundCash, reason: $reason) {
      id
      ticketNumber
      status
      depositRefunded
      totalCollected
    }
  }
`;

export const DECLARE_REPAIR_ABANDONMENT = gql`
  mutation DeclareRepairAbandonment($ticketNumber: String!, $salePrice: Float) {
    declareRepairAbandonment(ticketNumber: $ticketNumber, salePrice: $salePrice) {
      id
      ticketNumber
      status
      isAbandoned
      abandonedAt
      abandonmentSalePrice
    }
  }
`;

export const GET_SUPPLIERS = gql`
  query GetSuppliers($search: String) {
    suppliers(search: $search) {
      id
      name
      isInternal
      marketPlace
      boothNumber
      address
      contactName
      phoneReference
      notes
    }
  }
`;

export const CREATE_SUPPLIER = gql`
  mutation CreateSupplier($input: SupplierInput!) {
    createSupplier(input: $input) {
      id
      name
      marketPlace
      boothNumber
    }
  }
`;

export const UPDATE_SUPPLIER = gql`
  mutation UpdateSupplier($id: Int!, $input: SupplierInput!) {
    updateSupplier(id: $id, input: $input) {
      id
      name
      isInternal
      marketPlace
      boothNumber
      address
      contactName
      phoneReference
      notes
    }
  }
`;

export const DELETE_SUPPLIER = gql`
  mutation DeleteSupplier($id: Int!) {
    deleteSupplier(id: $id)
  }
`;

export const UPDATE_REPAIR_QUOTE = gql`
  mutation UpdateRepairQuote(
    $ticketNumber: String!
    $estimatedTotal: Float!
    $technicianNotes: String
    $status: String
  ) {
    updateRepairQuote(
      ticketNumber: $ticketNumber
      estimatedTotal: $estimatedTotal
      technicianNotes: $technicianNotes
      status: $status
    ) {
      id
      ticketNumber
      estimatedTotal
      remainingBalance
      status
      statusDisplay
      technicianNotes
    }
  }
`;

export const GENERATE_REPAIR_INVOICE = gql`
  mutation GenerateRepairInvoice($ticketNumber: String!) {
    generateRepairInvoice(ticketNumber: $ticketNumber) {
      id
      ticketNumber
      invoiceNumber
      invoicePdfKey
      invoicePdfUrl
      invoiceGeneratedAt
    }
  }
`;

// ==========================================
// VENTAS (POS) Y CIERRE DE CAJA
// ==========================================
export const GET_SALES = gql`
  query GetSales($limit: Int) {
    sales(limit: $limit) {
      id
      userName
      paymentCash
      paymentQr
      total
      createdAt
      items {
        id
        itemName
        isManualEntry
        customName
        quantity
        unitPrice
        subtotal
      }
    }
  }
`;

export const CREATE_SALE = gql`
  mutation CreateSale($input: CreateSaleInput!) {
    createSale(input: $input) {
      id
      userName
      paymentCash
      paymentQr
      total
      createdAt
    }
  }
`;

export const GET_DRAWER_SUMMARY = gql`
  query GetDrawerSummary($initialCash: Float) {
    activeDrawerSummary(initialCash: $initialCash) {
      date
      initialCash
      todaySalesCash
      todaySalesQr
      todayRepairsCash
      todayRepairsQr
      todayExpensesCash
      todayRefundsCash
      expectedDrawerCash
      expectedBankQr
    }
  }
`;

export const CREATE_CASH_CLOSE = gql`
  mutation CreateCashClose($input: CreateCashCloseInput!) {
    createCashClose(input: $input) {
      id
      date
      initialCash
      expectedCash
      actualCash
      difference
      expectedQrTotal
      closedByName
    }
  }
`;

export const GET_CASH_CLOSES = gql`
  query GetCashCloses($limit: Int) {
    cashCloses(limit: $limit) {
      id
      date
      initialCash
      salesCash
      salesQr
      repairsCash
      repairsQr
      expensesCash
      depositRefundsCash
      expectedCash
      actualCash
      difference
      expectedQrTotal
      closedByName
      createdAt
    }
  }
`;

// ==========================================
// SEGURIDAD: USUARIOS, ROLES & PERMISOS (RBAC)
// ==========================================
export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      username
      firstName
      lastName
      email
      roleDisplay
      roleId
      isAdmin
      permissions
    }
  }
`;

export const GET_ROLES = gql`
  query GetRoles {
    roles {
      id
      name
      description
      isProtected
      permissions
    }
  }
`;

export const GET_PERMISSIONS = gql`
  query GetPermissions {
    permissions {
      id
      code
      name
      description
      module
    }
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser(
    $username: String!
    $password: String!
    $firstName: String
    $lastName: String
    $email: String
    $roleId: Int
  ) {
    createUser(
      username: $username
      password: $password
      firstName: $firstName
      lastName: $lastName
      email: $email
      roleId: $roleId
    ) {
      id
      username
      roleDisplay
    }
  }
`;

export const ASSIGN_USER_ROLE = gql`
  mutation AssignUserRole($userId: Int!, $roleId: Int!) {
    assignUserRole(userId: $userId, roleId: $roleId) {
      id
      username
      roleDisplay
      roleId
    }
  }
`;

export const SYNC_ROLE_PERMISSIONS = gql`
  mutation SyncRolePermissions($roleId: Int!, $permissionCodes: [String!]!) {
    syncRolePermissions(roleId: $roleId, permissionCodes: $permissionCodes) {
      id
      name
      permissions
    }
  }
`;

export const CREATE_ROLE = gql`
  mutation CreateRole($name: String!, $description: String, $permissionCodes: [String!]) {
    createRole(name: $name, description: $description, permissionCodes: $permissionCodes) {
      id
      name
      permissions
    }
  }
`;

