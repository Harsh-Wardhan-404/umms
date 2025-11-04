# 📦 Stock Management API

## Overview
The Stock Management API provides comprehensive functionality for managing raw materials, packaging materials, and consumables. It includes features for tracking stock levels, managing purchase history with supplier details, uploading purchase bills, and automated low stock alerts.

## Features
- ✅ **Material Management**: Add new materials with supplier details, bill numbers, purchase dates, and costs
- ✅ **Purchase Bill Upload**: Upload scanned purchase bills (PDF/Images) and link them to purchase records
- ✅ **Stock Level Tracking**: View current stock levels with real-time updates
- ✅ **Low Stock Alerts**: Automated alerts when stock falls below minimum threshold
- ✅ **Stock Types**: Support for Raw materials (Herbs, Extracts, Actives), Packaging (Bottles, Jars, Labels), and Consumables
- ✅ **Stock Operations**: Add or subtract stock quantities with audit trail
- ✅ **Stock Summary**: View summaries by stock type

## API Endpoints

### Base URL
```
http://localhost:3000/api/stock
```

---

## 1. Add New Material

**Endpoint:** `POST /materials`

**Description:** Creates a new material entry with initial stock quantity and purchase history. Supports adding purchase records with supplier information, bill numbers, purchase dates, and costs.

**Request Body:**
```json
{
  "name": "Aloe Vera Extract",
  "type": "Raw",
  "unit": "kg",
  "currentStockQty": 100,
  "minThresholdQty": 20,
  "purchaseHistory": [
    {
      "supplierName": "ABC Suppliers",
      "billNumber": "BILL-001",
      "purchaseDate": "2024-01-15",
      "purchasedQty": 100,
      "costPerUnit": 25.50,
      "scannedBillUrl": null
    }
  ]
}
```

**Field Descriptions:**
- `name` (required): Unique name of the material
- `type` (required): Stock type - `Raw`, `Packaging`, or `Consumable`
- `unit` (required): Unit of measurement (e.g., "kg", "liters", "pieces")
- `currentStockQty` (required): Initial stock quantity
- `minThresholdQty` (required): Minimum stock level before alert
- `purchaseHistory` (optional): Array of purchase records with:
  - `supplierName`: Name of the supplier
  - `billNumber`: Purchase bill/invoice number
  - `purchaseDate`: Date of purchase (ISO format)
  - `purchasedQty`: Quantity purchased
  - `costPerUnit`: Cost per unit
  - `scannedBillUrl`: URL to scanned bill (can be added later via upload endpoint)

**Response (201 Created):**
```json
{
  "message": "Material added successfully",
  "material": {
    "id": "cmezjqrwp0000dtr20di85zzr",
    "name": "Aloe Vera Extract",
    "type": "Raw",
    "unit": "kg",
    "currentStockQty": 100,
    "minThresholdQty": 20,
    "purchaseHistory": [
      {
        "supplierName": "ABC Suppliers",
        "billNumber": "BILL-001",
        "purchaseDate": "2024-01-15T00:00:00.000Z",
        "purchasedQty": 100,
        "costPerUnit": 25.5,
        "scannedBillUrl": null
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields or material name already exists
- `500 Internal Server Error`: Server error during creation

---

## 2. Upload Purchase Bill

**Endpoint:** `POST /materials/:materialId/upload-bill`

**Description:** Uploads a scanned purchase bill (PDF or image) and links it to an existing purchase record by bill number.

**Content-Type:** `multipart/form-data`

**Path Parameters:**
- `materialId` (required): ID of the material

**Form Data:**
- `bill` (required): PDF or image file (max 10MB)
- `billNumber` (required): Bill number to link the uploaded file to

**Supported File Types:**
- PDF files (`application/pdf`)
- Image files (JPEG, PNG, GIF, etc.)

**Example Request (using curl):**
```bash
curl -X POST http://localhost:3000/api/stock/materials/cmezjqrwp0000dtr20di85zzr/upload-bill \
  -H "Content-Type: multipart/form-data" \
  -F "bill=@/path/to/bill.pdf" \
  -F "billNumber=BILL-001"
```

**Example Request (using JavaScript FormData):**
```javascript
const formData = new FormData();
formData.append('bill', fileInput.files[0]);
formData.append('billNumber', 'BILL-001');

fetch('http://localhost:3000/api/stock/materials/cmezjqrwp0000dtr20di85zzr/upload-bill', {
  method: 'POST',
  body: formData
});
```

**Response (200 OK):**
```json
{
  "message": "Bill uploaded successfully",
  "billUrl": "/uploads/bill-1705320600000-123456789.pdf",
  "material": {
    "id": "cmezjqrwp0000dtr20di85zzr",
    "name": "Aloe Vera Extract",
    "purchaseHistory": [
      {
        "supplierName": "ABC Suppliers",
        "billNumber": "BILL-001",
        "purchaseDate": "2024-01-15T00:00:00.000Z",
        "purchasedQty": 100,
        "costPerUnit": 25.5,
        "scannedBillUrl": "/uploads/bill-1705320600000-123456789.pdf"
      }
    ]
  }
}
```

**Error Responses:**
- `400 Bad Request`: No file uploaded or bill number missing
- `404 Not Found`: Material not found
- `500 Internal Server Error`: Server error during upload

**Note:** The uploaded file is accessible via the `/uploads` static route. Access the bill at: `http://localhost:3000/uploads/bill-{filename}`

---

## 3. View Current Stock Levels

**Endpoint:** `GET /materials`

**Description:** Retrieves all materials with their current stock levels. Supports filtering by stock type and low stock items.

**Query Parameters:**
- `type` (optional): Filter by stock type (`Raw`, `Packaging`, `Consumable`)
- `lowStock` (optional): Filter for low stock items (`true` or `false`)

**Example Requests:**
```http
GET /api/stock/materials
GET /api/stock/materials?type=Raw
GET /api/stock/materials?lowStock=true
GET /api/stock/materials?type=Packaging&lowStock=true
```

**Response (200 OK):**
```json
{
  "materials": [
    {
      "id": "cmezjqrwp0000dtr20di85zzr",
      "name": "Aloe Vera Extract",
      "type": "Raw",
      "unit": "kg",
      "currentStockQty": 15,
      "minThresholdQty": 20,
      "purchaseHistory": [...],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "isLowStock": true,
      "stockStatus": "LOW_STOCK"
    },
    {
      "id": "cmezjqrwp0000dtr20di85zzs",
      "name": "Glass Bottles",
      "type": "Packaging",
      "unit": "pieces",
      "currentStockQty": 500,
      "minThresholdQty": 100,
      "purchaseHistory": [...],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "isLowStock": false,
      "stockStatus": "OK"
    }
  ],
  "totalCount": 2,
  "lowStockCount": 1
}
```

**Response Fields:**
- `materials`: Array of material objects with:
  - `isLowStock`: Boolean indicating if stock is below threshold
  - `stockStatus`: Either `"LOW_STOCK"` or `"OK"`
- `totalCount`: Total number of materials returned
- `lowStockCount`: Number of materials with low stock

---

## 4. Get Material Details

**Endpoint:** `GET /materials/:materialId`

**Description:** Retrieves detailed information about a specific material including full purchase history.

**Path Parameters:**
- `materialId` (required): ID of the material

**Example Request:**
```http
GET /api/stock/materials/cmezjqrwp0000dtr20di85zzr
```

**Response (200 OK):**
```json
{
  "material": {
    "id": "cmezjqrwp0000dtr20di85zzr",
    "name": "Aloe Vera Extract",
    "type": "Raw",
    "unit": "kg",
    "currentStockQty": 15,
    "minThresholdQty": 20,
    "purchaseHistory": [
      {
        "supplierName": "ABC Suppliers",
        "billNumber": "BILL-001",
        "purchaseDate": "2024-01-15T00:00:00.000Z",
        "purchasedQty": 100,
        "costPerUnit": 25.5,
        "scannedBillUrl": "/uploads/bill-1705320600000-123456789.pdf"
      },
      {
        "supplierName": "XYZ Suppliers",
        "billNumber": "BILL-002",
        "purchaseDate": "2024-02-01T00:00:00.000Z",
        "purchasedQty": 50,
        "costPerUnit": 26.0,
        "scannedBillUrl": null
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "isLowStock": true,
    "stockStatus": "LOW_STOCK"
  }
}
```

**Error Responses:**
- `404 Not Found`: Material not found
- `500 Internal Server Error`: Server error

---

## 5. Update Stock Quantity

**Endpoint:** `PATCH /materials/:materialId/stock`

**Description:** Updates the stock quantity by adding or subtracting from current stock. Automatically checks for low stock status after update.

**Path Parameters:**
- `materialId` (required): ID of the material

**Request Body:**
```json
{
  "quantity": 50,
  "operation": "add",
  "notes": "Stock replenishment from purchase"
}
```

**Field Descriptions:**
- `quantity` (required): Amount to add or subtract
- `operation` (required): Either `"add"` or `"subtract"`
- `notes` (optional): Additional notes about the stock change

**Example Request (Add Stock):**
```json
{
  "quantity": 50,
  "operation": "add",
  "notes": "New purchase received"
}
```

**Example Request (Subtract Stock):**
```json
{
  "quantity": 25,
  "operation": "subtract",
  "notes": "Used in batch production"
}
```

**Response (200 OK):**
```json
{
  "message": "Stock updated successfully",
  "material": {
    "id": "cmezjqrwp0000dtr20di85zzr",
    "name": "Aloe Vera Extract",
    "type": "Raw",
    "unit": "kg",
    "currentStockQty": 65,
    "minThresholdQty": 20,
    "purchaseHistory": [...],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-16T14:20:00.000Z",
    "isLowStock": false,
    "stockStatus": "OK"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing quantity or operation, invalid operation, or insufficient stock
- `404 Not Found`: Material not found
- `500 Internal Server Error`: Server error

**Note:** Subtracting stock will return an error if the result would be negative.

---

## 6. Get Stock Types Summary

**Endpoint:** `GET /stock-types`

**Description:** Retrieves a summary of stock grouped by type, showing count and total quantity for each type.

**Example Request:**
```http
GET /api/stock/stock-types
```

**Response (200 OK):**
```json
{
  "stockTypes": [
    {
      "type": "Raw",
      "count": 15,
      "totalQuantity": 1250.5
    },
    {
      "type": "Packaging",
      "count": 8,
      "totalQuantity": 5000
    },
    {
      "type": "Consumable",
      "count": 5,
      "totalQuantity": 350.75
    }
  ],
  "totalMaterials": 28
}
```

**Response Fields:**
- `stockTypes`: Array of stock type summaries with:
  - `type`: Stock type name
  - `count`: Number of materials in this type
  - `totalQuantity`: Sum of all stock quantities for this type
- `totalMaterials`: Total number of materials across all types

---

## 7. Get Low Stock Alerts

**Endpoint:** `GET /alerts/low-stock`

**Description:** Retrieves all materials that are at or below their minimum threshold. Includes urgency levels and helpful alert messages.

**Example Request:**
```http
GET /api/stock/alerts/low-stock
```

**Response (200 OK):**
```json
{
  "alerts": [
    {
      "materialId": "cmezjqrwp0000dtr20di85zzr",
      "materialName": "Aloe Vera Extract",
      "currentStock": 0,
      "threshold": 20,
      "unit": "kg",
      "urgency": "CRITICAL",
      "message": "Aloe Vera Extract is out of stock!"
    },
    {
      "materialId": "cmezjqrwp0000dtr20di85zzs",
      "materialName": "Rose Extract",
      "currentStock": 15,
      "threshold": 20,
      "unit": "kg",
      "urgency": "WARNING",
      "message": "Rose Extract is below minimum threshold (15 kg < 20 kg)"
    }
  ],
  "totalAlerts": 2,
  "criticalAlerts": 1,
  "warningAlerts": 1
}
```

**Response Fields:**
- `alerts`: Array of alert objects with:
  - `materialId`: ID of the material
  - `materialName`: Name of the material
  - `currentStock`: Current stock quantity
  - `threshold`: Minimum threshold quantity
  - `unit`: Unit of measurement
  - `urgency`: Either `"CRITICAL"` (out of stock) or `"WARNING"` (below threshold)
  - `message`: Human-readable alert message
- `totalAlerts`: Total number of alerts
- `criticalAlerts`: Number of critical alerts (out of stock)
- `warningAlerts`: Number of warning alerts (below threshold)

**Alert Urgency Levels:**
- `CRITICAL`: Current stock is 0 (out of stock)
- `WARNING`: Current stock is greater than 0 but below minimum threshold

---

## Stock Types

The system supports three main stock types:

### 1. Raw Materials
- **Examples**: Herbs, Extracts, Active ingredients, Base oils
- **Common Units**: kg, liters, grams
- **Use Case**: Primary ingredients used in product formulations

### 2. Packaging Materials
- **Examples**: Bottles, Jars, Labels, Caps, Boxes
- **Common Units**: pieces, sets, boxes
- **Use Case**: Materials used for packaging finished products

### 3. Consumables
- **Examples**: Cleaning supplies, Gloves, Filters, Maintenance items
- **Common Units**: pieces, liters, boxes
- **Use Case**: Items consumed during production but not part of the final product

---

## Error Handling

All endpoints follow a consistent error response format:

**Error Response Structure:**
```json
{
  "error": "Error message description",
  "details": "Detailed error information (if available)"
}
```

**Common HTTP Status Codes:**
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters or missing required fields
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

---

## File Upload Constraints

When uploading purchase bills:

- **Maximum File Size**: 10MB
- **Allowed File Types**:
  - PDF files (`application/pdf`)
  - Image files (JPEG, PNG, GIF, WebP, etc.)
- **Storage Location**: Files are stored in the `uploads/` directory
- **File Access**: Uploaded files are accessible via `/uploads/{filename}`

---

## Best Practices

1. **Purchase History Management**:
   - Always include purchase history when creating materials with initial stock
   - Upload bills immediately after purchase for record-keeping
   - Link bills to purchase records using bill numbers

2. **Stock Monitoring**:
   - Set realistic minimum thresholds based on usage patterns
   - Regularly check low stock alerts to prevent stockouts
   - Monitor stock levels after each batch production

3. **Stock Updates**:
   - Always use the stock update endpoint for any stock changes
   - Include notes explaining the reason for stock changes
   - Verify stock quantities before and after updates

4. **Material Organization**:
   - Use consistent naming conventions for materials
   - Choose appropriate stock types for better categorization
   - Use standard units of measurement

---

## Example Workflow

### Complete Material Lifecycle

1. **Create Material with Initial Purchase**:
   ```bash
   POST /api/stock/materials
   {
     "name": "Lavender Essential Oil",
     "type": "Raw",
     "unit": "liters",
     "currentStockQty": 50,
     "minThresholdQty": 10,
     "purchaseHistory": [{
       "supplierName": "Essential Oils Co",
       "billNumber": "BILL-2024-001",
       "purchaseDate": "2024-01-15",
       "purchasedQty": 50,
       "costPerUnit": 150.00
     }]
   }
   ```

2. **Upload Purchase Bill**:
   ```bash
   POST /api/stock/materials/{materialId}/upload-bill
   FormData: { bill: file, billNumber: "BILL-2024-001" }
   ```

3. **Check Stock Levels**:
   ```bash
   GET /api/stock/materials?type=Raw
   ```

4. **Use Stock in Production** (Subtract):
   ```bash
   PATCH /api/stock/materials/{materialId}/stock
   {
     "quantity": 5,
     "operation": "subtract",
     "notes": "Used in batch BATCH-2024-001"
   }
   ```

5. **Monitor Low Stock**:
   ```bash
   GET /api/stock/alerts/low-stock
   ```

6. **Replenish Stock** (Add):
   ```bash
   PATCH /api/stock/materials/{materialId}/stock
   {
     "quantity": 30,
     "operation": "add",
     "notes": "New purchase - BILL-2024-002"
   }
   ```

---

## Integration Notes

- Stock levels are automatically deducted when batches are created (if integrated with batch management)
- Materials are linked to formulations via `FormulationIngredient` relations
- Purchase history is stored as JSON arrays for flexibility
- File uploads use Multer middleware with automatic file naming
- Static file serving is configured at `/uploads` route

---

## Future Enhancements

Potential features for future development:
- Stock valuation and cost tracking
- Supplier management integration
- Automated reorder points
- Stock movement history/audit log
- Batch expiry tracking
- Multi-location stock management
- Stock transfer between locations
- Stock adjustment reasons and approvals
