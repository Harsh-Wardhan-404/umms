# Batch Manufacturing System API

## Overview

The Batch Manufacturing System API provides comprehensive endpoints for managing production batches, tracking materials, monitoring quality, and generating production reports. This system integrates with the Formulation Management and Stock Management systems to ensure seamless production workflows.

## Features

- **Batch Creation & Management**: Create, track, and manage production batches
- **Material Management**: Auto-scale ingredient requirements and real-time inventory deduction
- **QR Code Generation**: Unique batch codes with QR codes for easy tracking
- **Photo Management**: Upload before/after packaging photos
- **Quality Control**: Track quality checks and inspections
- **Production Reports**: Generate comprehensive batch-wise production reports
- **Real-time Monitoring**: Track batch status and production progress
- **Worker Management**: Assign workers and supervisors to batches
- **Shift Management**: Track production across different shifts

## API Endpoints

### 1. Create New Batch

**POST** `/api/batches`

Creates a new production batch with automatic material calculation and inventory deduction.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "productName": "Herbal Face Cream",
  "formulationVersionId": "cmevr70ix0000dtshascg9nl4",
  "batchSize": 100.0,
  "workers": ["cmevr70ix0000dtshascg9nl4", "cmevr70ix0000dtshascg9nl5"],
  "shift": "Morning",
  "startTime": "2024-01-15T08:00:00.000Z",
  "productionNotes": "Standard production batch for Q1"
}
```

**Response (201):**
```json
{
  "message": "Batch created successfully",
  "batch": {
    "id": "cmevr70ix0000dtshascg9nl4",
    "batchCode": "HER-1m2n3x-abc123",
    "productName": "Herbal Face Cream",
    "formulationVersionId": "cmevr70ix0000dtshascg9nl4",
    "batchSize": 100.0,
    "supervisorId": "cmevr70ix0000dtshascg9nl4",
    "workers": ["cmevr70ix0000dtshascg9nl4", "cmevr70ix0000dtshascg9nl5"],
    "shift": "Morning",
    "startTime": "2024-01-15T08:00:00.000Z",
    "status": "Planned",
    "qrCodeData": "{\"batchCode\":\"HER-1m2n3x-abc123\",\"productName\":\"Herbal Face Cream\",\"formulationVersion\":1,\"batchSize\":100,\"startTime\":\"2024-01-15T08:00:00.000Z\"}",
    "productionNotes": "Standard production batch for Q1",
    "rawMaterialsUsed": [
      {
        "materialId": "cmevr70ix0000dtshascg9nl4",
        "quantityRequired": 25.0,
        "unit": "kg"
      }
    ],
    "photos": [],
    "qualityChecks": [],
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T08:00:00.000Z",
    "formulationVersion": {
      "id": "cmevr70ix0000dtshascg9nl4",
      "versionNumber": 1,
      "isLocked": true
    },
    "supervisor": {
      "id": "cmevr70ix0000dtshascg9nl4",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "materialsUsed": [
      {
        "id": "cmevr70ix0000dtshascg9nl4",
        "batchId": "cmevr70ix0000dtshascg9nl4",
        "materialId": "cmevr70ix0000dtshascg9nl4",
        "quantityUsed": 25.0
      }
    ]
  }
}
```

**Error Responses:**
- `400` - Missing required fields
- `400` - Formulation version not locked
- `400` - Insufficient materials
- `404` - Formulation version not found
- `500` - Server error

### 2. Get All Batches

**GET** `/api/batches`

Retrieves all batches with optional filtering and pagination.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `status` - Filter by batch status (Planned, InProgress, QualityCheck, Completed, Cancelled)
- `productName` - Filter by product name (partial match)
- `supervisorId` - Filter by supervisor ID
- `startDate` - Filter by start date (ISO string)
- `endDate` - Filter by end date (ISO string)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Example Request:**
```
GET /api/batches?status=InProgress&page=1&limit=5
```

**Response (200):**
```json
{
  "batches": [
    {
      "id": "cmevr70ix0000dtshascg9nl4",
      "batchCode": "HER-1m2n3x-abc123",
      "productName": "Herbal Face Cream",
      "batchSize": 100.0,
      "status": "InProgress",
      "startTime": "2024-01-15T08:00:00.000Z",
      "shift": "Morning",
      "formulationVersion": {
        "id": "cmevr70ix0000dtshascg9nl4",
        "versionNumber": 1,
        "formulation": {
          "productName": "Herbal Face Cream"
        }
      },
      "supervisor": {
        "id": "cmevr70ix0000dtshascg9nl4",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "materialsUsed": [
        {
          "id": "cmevr70ix0000dtshascg9nl4",
          "materialId": "cmevr70ix0000dtshascg9nl4",
          "quantityUsed": 25.0,
          "material": {
            "name": "Herbal Extract",
            "type": "Raw"
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "totalCount": 25,
    "totalPages": 5
  }
}
```

### 3. Get Batch by ID

**GET** `/api/batches/:batchId`

Retrieves detailed information about a specific batch.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200):**
```json
{
  "batch": {
    "id": "cmevr70ix0000dtshascg9nl4",
    "batchCode": "HER-1m2n3x-abc123",
    "productName": "Herbal Face Cream",
    "formulationVersionId": "cmevr70ix0000dtshascg9nl4",
    "batchSize": 100.0,
    "supervisorId": "cmevr70ix0000dtshascg9nl4",
    "workers": ["cmevr70ix0000dtshascg9nl4", "cmevr70ix0000dtshascg9nl5"],
    "shift": "Morning",
    "startTime": "2024-01-15T08:00:00.000Z",
    "endTime": null,
    "status": "InProgress",
    "rawMaterialsUsed": [
      {
        "materialId": "cmevr70ix0000dtshascg9nl4",
        "quantityRequired": 25.0,
        "unit": "kg"
      }
    ],
    "qrCodeData": "{\"batchCode\":\"HER-1m2n3x-abc123\",\"productName\":\"Herbal Face Cream\",\"formulationVersion\":1,\"batchSize\":100,\"startTime\":\"2024-01-15T08:00:00.000Z\"}",
    "photos": [],
    "productionNotes": "Standard production batch for Q1",
    "qualityChecks": [],
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T08:00:00.000Z",
    "formulationVersion": {
      "id": "cmevr70ix0000dtshascg9nl4",
      "versionNumber": 1,
      "isLocked": true,
      "formulation": {
        "id": "cmevr70ix0000dtshascg9nl4",
        "productName": "Herbal Face Cream"
      },
      "ingredients": [
        {
          "id": "cmevr70ix0000dtshascg9nl4",
          "materialId": "cmevr70ix0000dtshascg9nl4",
          "percentageOrComposition": 25.0,
          "unit": "kg",
          "notes": "Primary active ingredient",
          "material": {
            "id": "cmevr70ix0000dtshascg9nl4",
            "name": "Herbal Extract",
            "type": "Raw",
            "unit": "kg"
          }
        }
      ]
    },
    "supervisor": {
      "id": "cmevr70ix0000dtshascg9nl4",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "materialsUsed": [
      {
        "id": "cmevr70ix0000dtshascg9nl4",
        "batchId": "cmevr70ix0000dtshascg9nl4",
        "materialId": "cmevr70ix0000dtshascg9nl4",
        "quantityUsed": 25.0,
        "material": {
          "id": "cmevr70ix0000dtshascg9nl4",
          "name": "Herbal Extract",
          "type": "Raw",
          "unit": "kg"
        }
      }
    ],
    "finishedGood": null
  }
}
```

### 4. Get Batch by QR Code

**GET** `/api/batches/qr/:batchCode`

Retrieves batch information using the batch code (for QR code scanning).

**Headers:**
```
None required (public endpoint)
```

**Response (200):**
```json
{
  "batch": {
    "id": "cmevr70ix0000dtshascg9nl4",
    "batchCode": "HER-1m2n3x-abc123",
    "productName": "Herbal Face Cream",
    "status": "InProgress",
    "startTime": "2024-01-15T08:00:00.000Z",
    "shift": "Morning",
    "formulationVersion": {
      "versionNumber": 1,
      "formulation": {
        "productName": "Herbal Face Cream"
      }
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
  }
}
```

### 5. Update Batch Status

**PATCH** `/api/batches/:batchId/status`

Updates the status of a batch (Admin/Supervisor only).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "QualityCheck",
  "endTime": "2024-01-15T16:00:00.000Z",
  "productionNotes": "Production completed, ready for quality inspection"
}
```

**Response (200):**
```json
{
  "message": "Batch status updated successfully",
  "batch": {
    "id": "cmevr70ix0000dtshascg9nl4",
    "batchCode": "HER-1m2n3x-abc123",
    "status": "QualityCheck",
    "endTime": "2024-01-15T16:00:00.000Z",
    "productionNotes": "Production completed, ready for quality inspection"
  }
}
```

### 6. Upload Photos

**POST** `/api/batches/:batchId/photos`

Uploads photos for a batch (Admin/Supervisor/Worker).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Form Data:**
- `photos` - Array of image files (max 10, max 10MB each)
- `photoType` - Type of photo: "before", "after", "quality_check", "general"
- `notes` - Optional notes about the photos

**Response (200):**
```json
{
  "message": "Photos uploaded successfully",
  "photos": [
    {
      "type": "before",
      "url": "/uploads/batches/1705315200000-uuid123.jpg",
      "notes": "Raw materials before processing",
      "timestamp": "2024-01-15T08:00:00.000Z",
      "uploadedBy": "cmevr70ix0000dtshascg9nl4"
    }
  ],
  "batch": {
    "id": "cmevr70ix0000dtshascg9nl4",
    "photos": [...]
  }
}
```

### 7. Add Quality Check

**POST** `/api/batches/:batchId/quality-checks`

Adds a quality check record to a batch (Admin/Supervisor/Worker).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "checkType": "Visual Inspection",
  "result": "pass",
  "notes": "All products meet visual quality standards",
  "inspectorId": "cmevr70ix0000dtshascg9nl4"
}
```

**Response (200):**
```json
{
  "message": "Quality check added successfully",
  "qualityCheck": {
    "id": "uuid123",
    "checkType": "Visual Inspection",
    "result": "pass",
    "notes": "All products meet visual quality standards",
    "inspectorId": "cmevr70ix0000dtshascg9nl4",
    "timestamp": "2024-01-15T16:30:00.000Z"
  },
  "batch": {
    "id": "cmevr70ix0000dtshascg9nl4",
    "qualityChecks": [...]
  }
}
```

### 8. Generate Production Report

**GET** `/api/batches/:batchId/report`

Generates a comprehensive production report for a specific batch.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200):**
```json
{
  "report": {
    "batchInfo": {
      "batchCode": "HER-1m2n3x-abc123",
      "productName": "Herbal Face Cream",
      "formulationVersion": 1,
      "batchSize": 100.0,
      "status": "Completed",
      "startTime": "2024-01-15T08:00:00.000Z",
      "endTime": "2024-01-15T16:00:00.000Z",
      "productionTime": 8.0,
      "supervisor": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "workers": ["cmevr70ix0000dtshascg9nl4", "cmevr70ix0000dtshascg9nl5"],
      "shift": "Morning"
    },
    "materials": {
      "used": [
        {
          "material": {
            "name": "Herbal Extract",
            "type": "Raw"
          },
          "quantityUsed": 25.0
        }
      ],
      "totalCost": 375.0
    },
    "quality": {
      "checks": [
        {
          "checkType": "Visual Inspection",
          "result": "pass",
          "timestamp": "2024-01-15T16:30:00.000Z"
        }
      ],
      "passRate": 100.0
    },
    "photos": [
      {
        "type": "before",
        "url": "/uploads/batches/1705315200000-uuid123.jpg",
        "timestamp": "2024-01-15T08:00:00.000Z"
      }
    ],
    "productionNotes": "Production completed, ready for quality inspection",
    "finishedGoods": {
      "quantityProduced": 95.0
    },
    "efficiency": {
      "productionHours": 8.0,
      "outputPerHour": 11.875
    }
  }
}
```

### 9. Get Batch Statistics

**GET** `/api/batches/stats/overview`

Retrieves overview statistics for all batches.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `startDate` - Start date for statistics (ISO string)
- `endDate` - End date for statistics (ISO string)

**Response (200):**
```json
{
  "stats": {
    "totalBatches": 25,
    "completedBatches": 20,
    "inProgressBatches": 3,
    "totalProduction": 2500.0,
    "averageBatchSize": 100.0,
    "completionRate": 80.0,
    "statusDistribution": [
      {
        "status": "Completed",
        "_count": {
          "status": 20
        }
      },
      {
        "status": "InProgress",
        "_count": {
          "status": 3
        }
      },
      {
        "status": "Planned",
        "_count": {
          "status": 2
        }
      }
    ]
  }
}
```

## Data Models

### Batch Status Enum
```typescript
enum BatchStatus {
  Planned      // Batch is planned but not started
  InProgress   // Production is currently running
  QualityCheck // Production complete, under quality inspection
  Completed    // Batch completed successfully
  Cancelled    // Batch was cancelled
}
```

### Shift Types
- `Morning` - Morning shift (typically 6 AM - 2 PM)
- `Evening` - Evening shift (typically 2 PM - 10 PM)
- `Night` - Night shift (typically 10 PM - 6 AM)

### Photo Types
- `before` - Before packaging/production
- `after` - After packaging/production
- `quality_check` - Quality inspection photos
- `general` - General production photos

### Quality Check Results
- `pass` - Quality check passed
- `fail` - Quality check failed
- `conditional` - Conditional pass with notes

## Business Logic

### Material Calculation
- Ingredient requirements are automatically calculated based on batch size
- Formula: `(percentage / 100) * batchSize`
- Materials are deducted from inventory in real-time
- Batch creation fails if insufficient materials

### Batch Code Generation
- Format: `{PRODUCT_CODE}-{TIMESTAMP}-{RANDOM}`
- Example: `HER-1m2n3x-abc123`
- Ensures uniqueness across all batches

### QR Code Data
- Contains essential batch information
- Can be scanned to quickly access batch details
- Includes batch code, product name, version, size, and start time

### Inventory Management
- Real-time deduction of materials when batch is created
- Prevents over-allocation of materials
- Maintains accurate stock levels

## Error Handling

### Common Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (batch/formulation not found)
- `500` - Internal Server Error

### Validation Rules
- Batch size must be positive number
- Workers array must contain valid user IDs
- Shift must be one of: Morning, Evening, Night
- Start time must be valid date
- Formulation version must be locked

## Security

### Authentication
- All endpoints require valid JWT token (except QR code lookup)
- Token must be included in Authorization header

### Authorization
- Batch creation: Admin, Supervisor
- Status updates: Admin, Supervisor
- Photo uploads: Admin, Supervisor, Worker
- Quality checks: Admin, Supervisor, Worker
- Reports and statistics: All authenticated users

### File Upload Security
- Only image files allowed (JPEG, PNG, GIF)
- Maximum file size: 10MB
- Files stored in secure uploads directory
- Unique filenames prevent conflicts

## Integration Points

### Stock Management
- Automatically deducts materials from inventory
- Checks material availability before batch creation
- Updates stock levels in real-time

### Formulation Management
- Requires locked formulation versions
- Calculates ingredient requirements automatically
- Maintains version control and traceability

### User Management
- Links batches to supervisors and workers
- Tracks user involvement in production
- Enables role-based access control

## Performance Considerations

### Database Queries
- Uses efficient Prisma queries with proper includes
- Implements pagination for large datasets
- Optimized joins for related data

### File Handling
- Asynchronous file uploads
- Efficient storage and retrieval
- Image optimization recommendations

### Caching
- Consider implementing Redis for frequently accessed data
- Cache batch statistics and reports
- Implement query result caching

## Monitoring and Logging

### Logging
- All API operations are logged
- Error details captured for debugging
- Performance metrics tracked

### Metrics
- Batch creation rate
- Production completion time
- Quality check pass rates
- Material consumption patterns

## Testing Guide

### Prerequisites
1. Ensure the backend server is running
2. Have valid JWT tokens for different user roles
3. Create test materials and formulations first
4. Set up test database with sample data

### Testing Checklist

#### 1. Batch Creation
- [ ] Create batch with valid data
- [ ] Verify material deduction from inventory
- [ ] Check batch code generation
- [ ] Validate QR code data
- [ ] Test with insufficient materials
- [ ] Test with unlocked formulation

#### 2. Batch Retrieval
- [ ] Get all batches with pagination
- [ ] Filter batches by status
- [ ] Filter batches by date range
- [ ] Get batch by ID
- [ ] Get batch by QR code
- [ ] Test with invalid batch ID

#### 3. Batch Updates
- [ ] Update batch status
- [ ] Add production notes
- [ ] Set end time
- [ ] Test status transitions
- [ ] Verify permission restrictions

#### 4. Photo Management
- [ ] Upload single photo
- [ ] Upload multiple photos
- [ ] Test file type validation
- [ ] Test file size limits
- [ ] Verify photo metadata

#### 5. Quality Checks
- [ ] Add quality check record
- [ ] Test different check types
- [ ] Verify inspector assignment
- [ ] Test result validation

#### 6. Reports and Statistics
- [ ] Generate batch report
- [ ] Calculate production efficiency
- [ ] Get overview statistics
- [ ] Test date filtering
- [ ] Verify calculation accuracy

### Test Data Setup

#### Create Test Materials
```bash
curl -X POST http://localhost:3000/api/stock/materials \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Herb Extract",
    "type": "Raw",
    "unit": "kg",
    "currentStockQty": 100,
    "minThresholdQty": 10,
    "purchaseHistory": [{
      "supplierName": "Test Supplier",
      "billNumber": "TEST-001",
      "purchaseDate": "2024-01-01T00:00:00.000Z",
      "purchasedQty": 100,
      "costPerUnit": 15
    }]
  }'
```

#### Create Test Formulation
```bash
curl -X POST http://localhost:3000/api/formulations \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Test Product",
    "ingredients": [{
      "materialId": "<MATERIAL_ID>",
      "percentageOrComposition": 25,
      "unit": "kg",
      "notes": "Test ingredient"
    }]
  }'
```

### Postman Collection

#### Environment Variables
```
BASE_URL: http://localhost:3000
ADMIN_TOKEN: <admin_jwt_token>
SUPERVISOR_TOKEN: <supervisor_jwt_token>
WORKER_TOKEN: <worker_jwt_token>
```

#### Pre-request Scripts
```javascript
// Set authorization header based on role
if (pm.environment.get("ADMIN_TOKEN")) {
    pm.request.headers.add({
        key: "Authorization",
        value: "Bearer " + pm.environment.get("ADMIN_TOKEN")
    });
}
```

#### Test Scripts
```javascript
// Verify successful response
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has required fields", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('batch');
    pm.expect(response.batch).to.have.property('batchCode');
});
```

### Common Test Scenarios

#### 1. Complete Batch Lifecycle
1. Create batch in "Planned" status
2. Update status to "InProgress"
3. Upload before photos
4. Add quality checks
5. Update status to "QualityCheck"
6. Upload after photos
7. Update status to "Completed"
8. Generate production report

#### 2. Error Handling
1. Test with invalid formulation ID
2. Test with insufficient materials
3. Test with invalid status transitions
4. Test permission restrictions
5. Test file upload errors

#### 3. Performance Testing
1. Create multiple batches simultaneously
2. Upload large photo files
3. Generate reports for large datasets
4. Test pagination with many records

## Troubleshooting

### Common Issues

#### 1. Material Deduction Errors
- **Problem**: Materials not deducted from inventory
- **Solution**: Check if materials exist and have sufficient stock
- **Debug**: Verify material IDs in batch creation request

#### 2. Photo Upload Failures
- **Problem**: Photos not uploading
- **Solution**: Check file size and type restrictions
- **Debug**: Verify uploads/batches directory exists and is writable

#### 3. Permission Errors
- **Problem**: 403 Forbidden responses
- **Solution**: Verify user role and JWT token
- **Debug**: Check middleware configuration and user permissions

#### 4. Database Connection Issues
- **Problem**: Prisma client errors
- **Solution**: Verify database connection and Prisma setup
- **Debug**: Check DATABASE_URL environment variable

### Debug Steps
1. Check server logs for detailed error messages
2. Verify database schema matches Prisma models
3. Test individual endpoints with simple requests
4. Check authentication middleware configuration
5. Verify file upload directory permissions

## Next Steps

### Planned Enhancements
1. **Real-time Notifications**: WebSocket integration for live updates
2. **Mobile App Support**: Optimized endpoints for mobile applications
3. **Advanced Analytics**: Machine learning for production optimization
4. **Integration APIs**: Connect with external manufacturing systems
5. **Audit Trail**: Comprehensive logging of all batch operations

### Performance Optimizations
1. **Database Indexing**: Optimize queries for large datasets
2. **Caching Layer**: Implement Redis for frequently accessed data
3. **File Compression**: Optimize photo storage and retrieval
4. **Batch Processing**: Handle multiple operations efficiently

### Security Enhancements
1. **Rate Limiting**: Prevent API abuse
2. **Input Validation**: Enhanced request validation
3. **Audit Logging**: Track all system access and changes
4. **Encryption**: Encrypt sensitive data at rest

## Support

For technical support or questions about the Batch Manufacturing System API:

1. **Documentation**: Refer to this guide and related API docs
2. **Logs**: Check server logs for detailed error information
3. **Testing**: Use the provided test scenarios and Postman collection
4. **Development**: Review source code and Prisma schema

---

*This API provides a robust foundation for manufacturing batch management with comprehensive tracking, quality control, and reporting capabilities.*
