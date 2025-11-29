# Finished Goods Inventory & Sales Billing API

## Overview

The Finished Goods Inventory & Sales Billing API provides comprehensive endpoints for managing post-production inventory, client management, and GST-compliant invoicing. This system integrates with the Batch Manufacturing System to track finished goods and generate professional invoices for sales.

## Features

- **Finished Goods Management**: Track post-production inventory with batch linkage
- **Client Management**: Comprehensive client database with GST/PAN details
- **GST-Compliant Invoicing**: Automatic tax calculations (CGST/SGST/IGST)
- **Sales Dispatch**: Link invoices with dispatch and tracking
- **Inventory Tracking**: Real-time quantity updates and availability
- **Quality Control**: Track quality status of finished goods
- **Financial Reporting**: Invoice statistics and payment tracking

## API Endpoints

### Finished Goods Management

#### 1. Create Finished Goods Entry

**POST** `/api/finished-goods`

Creates a new finished goods entry after production completion.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "batchId": "cmevr70ix0000dtshascg9nl4",
  "productName": "Herbal Face Cream",
  "quantityProduced": 95.0,
  "availableQuantity": 95.0,
  "unitPrice": 150.0,
  "hsnCode": "3304.99",
  "qualityStatus": "Approved"
}
```

**Response (201):**
```json
{
  "message": "Finished goods created successfully",
  "finishedGood": {
    "id": "cmevr70ix0000dtshascg9nl4",
    "batchId": "cmevr70ix0000dtshascg9nl4",
    "productName": "Herbal Face Cream",
    "quantityProduced": 95.0,
    "availableQuantity": 95.0,
    "unitPrice": 150.0,
    "hsnCode": "3304.99",
    "qualityStatus": "Approved",
    "createdAt": "2024-01-15T16:00:00.000Z",
    "updatedAt": "2024-01-15T16:00:00.000Z",
    "batch": {
      "id": "cmevr70ix0000dtshascg9nl4",
      "batchCode": "HER-1m2n3x-abc123",
      "formulationVersion": {
        "id": "cmevr70ix0000dtshascg9nl4",
        "versionNumber": 1,
        "formulation": {
          "productName": "Herbal Face Cream"
        }
      }
    }
  }
}
```

#### 2. Get All Finished Goods

**GET** `/api/finished-goods`

Retrieves all finished goods with optional filtering and pagination.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `productName` - Filter by product name (partial match)
- `qualityStatus` - Filter by quality status (Approved, Pending, Rejected)
- `availableOnly` - Show only available items (true/false)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Response (200):**
```json
{
  "finishedGoods": [
    {
      "id": "cmevr70ix0000dtshascg9nl4",
      "productName": "Herbal Face Cream",
      "quantityProduced": 95.0,
      "availableQuantity": 95.0,
      "unitPrice": 150.0,
      "hsnCode": "3304.99",
      "qualityStatus": "Approved",
      "batch": {
        "batchCode": "HER-1m2n3x-abc123",
        "formulationVersion": {
          "versionNumber": 1,
          "formulation": {
            "productName": "Herbal Face Cream"
          }
        },
        "supervisor": {
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 25,
    "totalPages": 3
  }
}
```

#### 3. Get Finished Goods by ID

**GET** `/api/finished-goods/:id`

Retrieves detailed information about specific finished goods.

**Response (200):**
```json
{
  "finishedGood": {
    "id": "cmevr70ix0000dtshascg9nl4",
    "batchId": "cmevr70ix0000dtshascg9nl4",
    "productName": "Herbal Face Cream",
    "quantityProduced": 95.0,
    "availableQuantity": 95.0,
    "unitPrice": 150.0,
    "hsnCode": "3304.99",
    "qualityStatus": "Approved",
    "batch": {
      "batchCode": "HER-1m2n3x-abc123",
      "formulationVersion": {
        "versionNumber": 1,
        "formulation": {
          "productName": "Herbal Face Cream"
        },
        "ingredients": [
          {
            "material": {
              "name": "Herbal Extract",
              "type": "Raw"
            },
            "percentageOrComposition": 25.0,
            "unit": "kg"
          }
        ]
      },
      "supervisor": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "materialsUsed": [
        {
          "material": {
            "name": "Herbal Extract",
            "type": "Raw"
          },
          "quantityUsed": 25.0
        }
      ]
    },
    "invoiceItems": []
  }
}
```

#### 4. Update Finished Goods

**PATCH** `/api/finished-goods/:id`

Updates finished goods information (Admin/Supervisor only).

**Request Body:**
```json
{
  "availableQuantity": 90.0,
  "unitPrice": 160.0,
  "hsnCode": "3304.99",
  "qualityStatus": "Approved"
}
```

#### 5. Get Inventory Summary

**GET** `/api/finished-goods/inventory/summary`

Retrieves inventory overview and statistics.

**Response (200):**
```json
{
  "summary": {
    "totalProducts": 25,
    "totalAvailableQuantity": 2500.0,
    "lowStockItems": [
      {
        "id": "cmevr70ix0000dtshascg9nl4",
        "productName": "Herbal Face Cream",
        "availableQuantity": 5.0,
        "unitPrice": 150.0
      }
    ],
    "qualitySummary": [
      {
        "qualityStatus": "Approved",
        "_count": {
          "qualityStatus": 20
        }
      },
      {
        "qualityStatus": "Pending",
        "_count": {
          "qualityStatus": 5
        }
      }
    ]
  }
}
```

### Client Management

#### 1. Create New Client

**POST** `/api/clients`

Creates a new client record (Admin/Sales only).

**Request Body:**
```json
{
  "name": "ABC Pharmaceuticals Ltd",
  "email": "orders@abcpharma.com",
  "phone": "+91-9876543210",
  "address": "123 Business Park, Mumbai, Maharashtra - 400001",
  "gstNumber": "27AABC1234Z1Z5",
  "panNumber": "AABC1234Z",
  "contactPerson": "Mr. Rajesh Kumar",
  "creditLimit": 100000.0,
  "paymentTerms": "Net 30"
}
```

**Response (201):**
```json
{
  "message": "Client created successfully",
  "client": {
    "id": "cmevr70ix0000dtshascg9nl4",
    "name": "ABC Pharmaceuticals Ltd",
    "email": "orders@abcpharma.com",
    "phone": "+91-9876543210",
    "address": "123 Business Park, Mumbai, Maharashtra - 400001",
    "gstNumber": "27AABC1234Z1Z5",
    "panNumber": "AABC1234Z",
    "contactPerson": "Mr. Rajesh Kumar",
    "creditLimit": 100000.0,
    "paymentTerms": "Net 30",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

#### 2. Get All Clients

**GET** `/api/clients`

Retrieves all clients with filtering and pagination.

**Query Parameters:**
- `search` - Search by name, email, or contact person
- `isActive` - Filter by active status (true/false)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

#### 3. Get Client by ID

**GET** `/api/clients/:id`

Retrieves client details with recent invoices and feedback.

#### 4. Update Client

**PATCH** `/api/clients/:id`

Updates client information (Admin/Sales only).

#### 5. Deactivate Client

**DELETE** `/api/clients/:id`

Soft deletes client by setting isActive to false (Admin only).

#### 6. Get Client Statistics

**GET** `/api/clients/stats/overview`

Retrieves client overview statistics.

### Invoicing System

#### 1. Create New Invoice

**POST** `/api/invoices`

Creates a new GST-compliant invoice (Admin/Sales only).

**Request Body:**
```json
{
  "clientId": "cmevr70ix0000dtshascg9nl4",
  "invoiceDate": "2024-01-15T00:00:00.000Z",
  "dueDate": "2024-02-14T00:00:00.000Z",
  "items": [
    {
      "finishedGoodId": "cmevr70ix0000dtshascg9nl4",
      "quantity": 50.0,
      "pricePerUnit": 150.0,
      "hsnCode": "3304.99"
    }
  ],
  "notes": "Standard delivery terms apply"
}
```

**Response (201):**
```json
{
  "message": "Invoice created successfully",
  "invoice": {
    "id": "cmevr70ix0000dtshascg9nl4",
    "invoiceNumber": "INV-1m2n3x-ABC123",
    "clientId": "cmevr70ix0000dtshascg9nl4",
    "creatorId": "cmevr70ix0000dtshascg9nl4",
    "invoiceDate": "2024-01-15T00:00:00.000Z",
    "dueDate": "2024-02-14T00:00:00.000Z",
    "items": [
      {
        "finishedGoodId": "cmevr70ix0000dtshascg9nl4",
        "quantity": 50.0,
        "pricePerUnit": 150.0,
        "hsnCode": "3304.99",
        "itemTotal": 7500.0
      }
    ],
    "subtotal": 7500.0,
    "taxDetails": {
      "cgst": 675.0,
      "sgst": 675.0,
      "igst": 0,
      "totalTax": 1350.0,
      "gstRate": 18
    },
    "totalAmount": 8850.0,
    "notes": "Standard delivery terms apply",
    "paymentStatus": "Pending",
    "client": {
      "name": "ABC Pharmaceuticals Ltd",
      "email": "orders@abcpharma.com",
      "gstNumber": "27AABC1234Z1Z5"
    },
    "creator": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@company.com"
    }
  }
}
```

#### 2. Get All Invoices

**GET** `/api/invoices`

Retrieves all invoices with filtering and pagination.

**Query Parameters:**
- `clientId` - Filter by client ID
- `paymentStatus` - Filter by payment status (Pending, Partial, Paid)
- `startDate` - Filter by invoice date range
- `endDate` - Filter by invoice date range
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

#### 3. Get Invoice by ID

**GET** `/api/invoices/:id`

Retrieves detailed invoice information with all related data.

#### 4. Update Payment Status

**PATCH** `/api/invoices/:id/payment-status`

Updates invoice payment status (Admin/Sales only).

**Request Body:**
```json
{
  "paymentStatus": "Paid",
  "notes": "Payment received via bank transfer"
}
```

#### 5. Generate Invoice PDF

**GET** `/api/invoices/:id/pdf`

Generates invoice PDF (placeholder implementation).

#### 6. Get Invoice Statistics

**GET** `/api/invoices/stats/overview`

Retrieves invoice overview statistics.

## Data Models

### FinishedGood Model
```typescript
model FinishedGood {
  id               String   @id @default(cuid())
  batchId          String   @unique @map("batch_id")
  productName      String   @map("product_name")
  quantityProduced Float    @map("quantity_produced")
  availableQuantity Float   @map("available_quantity")
  unitPrice        Float    @map("unit_price")
  hsnCode          String   @map("hsn_code")
  qualityStatus    String   @default("Approved")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  // Relations
  batch        Batch         @relation(fields: [batchId], references: [id])
  formulation  Formulation   @relation(fields: [productName], references: [productName])
  invoiceItems InvoiceItem[]
}
```

### Client Model
```typescript
model Client {
  id              String   @id @default(cuid())
  name            String
  email           String?  @unique
  phone           String?
  address         String?
  gstNumber       String?  @map("gst_number")
  panNumber       String?  @map("pan_number")
  contactPerson   String?  @map("contact_person")
  creditLimit     Float?   @default(0) @map("credit_limit")
  paymentTerms    String?  @map("payment_terms")
  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  // Relations
  invoices Invoice[]
  feedback Feedback[]
}
```

### Invoice Model
```typescript
model Invoice {
  id              String   @id @default(cuid())
  invoiceNumber   String   @unique @map("invoice_number")
  clientId        String   @map("client_id")
  creatorId       String   @map("creator_id")
  invoiceDate     DateTime @map("invoice_date")
  dueDate         DateTime @map("due_date")
  items           Json[]   // Array of invoice item objects
  subtotal        Float
  taxDetails      Json     @map("tax_details")
  totalAmount     Float    @map("total_amount")
  invoicePdfUrl   String?  @map("invoice_pdf_url")
  paymentStatus   String   @default("Pending") @map("payment_status")
  notes           String?
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  // Relations
  invoiceItems InvoiceItem[]
  dispatch     Dispatch?
  creator      User       @relation(fields: [creatorId], references: [id])
  client       Client     @relation(fields: [clientId], references: [id])
}
```

## Business Logic

### GST Calculation
- **Intrastate Supply**: CGST + SGST (9% + 9% = 18%)
- **Interstate Supply**: IGST (18%)
- **HSN Code Based**: Different rates for different product categories
- **Automatic Calculation**: Based on subtotal and HSN code

### Inventory Management
- **Real-time Updates**: Quantities updated when invoices are created
- **Batch Linkage**: Every finished good linked to production batch
- **Quality Tracking**: Status tracking (Approved, Pending, Rejected)
- **Availability Check**: Prevents overselling

### Invoice Generation
- **Unique Numbers**: Auto-generated invoice numbers
- **Client Auto-fill**: Pre-filled client details
- **Batch Tracking**: Links to production batches
- **Payment Terms**: Configurable payment terms

## Security

### Authentication
- All endpoints require valid JWT token
- Token must be included in Authorization header

### Authorization
- **Finished Goods**: Admin, Supervisor
- **Client Management**: Admin, Sales
- **Invoicing**: Admin, Sales
- **Read Operations**: All authenticated users

## Integration Points

### Batch Manufacturing
- Finished goods created from completed batches
- Batch information included in finished goods
- Material consumption tracking

### Stock Management
- Raw materials consumed in production
- Finished goods inventory tracking
- Real-time stock updates

### User Management
- Creator tracking for all records
- Role-based access control
- Audit trail maintenance

## Testing Guide

### Prerequisites
1. Ensure backend server is running
2. Have valid JWT tokens for different user roles
3. Create test batches and formulations first
4. Set up test database with sample data

### Testing Workflow

#### 1. Create Client
```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Client",
    "email": "test@client.com",
    "phone": "+91-9876543210",
    "address": "Test Address",
    "gstNumber": "27TEST1234Z1Z5",
    "panNumber": "TEST1234Z"
  }'
```

#### 2. Create Finished Goods
```bash
curl -X POST http://localhost:3000/api/finished-goods \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "batchId": "<BATCH_ID>",
    "productName": "Test Product",
    "quantityProduced": 100.0,
    "availableQuantity": 100.0,
    "unitPrice": 150.0,
    "hsnCode": "3304.99"
  }'
```

#### 3. Create Invoice
```bash
curl -X POST http://localhost:3000/api/invoices \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "<CLIENT_ID>",
    "invoiceDate": "2024-01-15T00:00:00.000Z",
    "items": [{
      "finishedGoodId": "<FINISHED_GOOD_ID>",
      "quantity": 50.0,
      "pricePerUnit": 150.0,
      "hsnCode": "3304.99"
    }]
  }'
```

### Test Checklist

- [ ] Client creation and management
- [ ] Finished goods creation from batches
- [ ] Inventory updates and tracking
- [ ] Invoice creation with GST calculation
- [ ] Payment status updates
- [ ] PDF generation endpoint
- [ ] Statistics and reporting
- [ ] Error handling and validation

## Error Handling

### Common Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource not found)
- `500` - Internal Server Error

### Validation Rules
- **Finished Goods**: Batch must be completed, quantities must be positive
- **Clients**: Name is required, email must be unique
- **Invoices**: Client must exist, items must be valid, quantities available

## Performance Considerations

### Database Queries
- Efficient Prisma queries with proper includes
- Pagination for large datasets
- Optimized joins for related data

### Caching
- Consider Redis for frequently accessed data
- Cache client and product information
- Implement query result caching

## Next Steps

### Planned Enhancements
1. **PDF Generation**: Implement actual PDF generation using libraries like Puppeteer
2. **Email Integration**: Send invoices via email
3. **Payment Gateway**: Integrate with payment processors
4. **Advanced Reporting**: Financial reports and analytics
5. **Mobile App Support**: Optimized endpoints for mobile applications

### Security Enhancements
1. **Rate Limiting**: Prevent API abuse
2. **Input Validation**: Enhanced request validation
3. **Audit Logging**: Track all system access and changes
4. **Data Encryption**: Encrypt sensitive data at rest

---

*This API provides a comprehensive foundation for finished goods inventory management and GST-compliant invoicing with professional client management capabilities.*
