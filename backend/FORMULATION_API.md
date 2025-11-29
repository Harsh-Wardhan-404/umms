# 🧪 Formulation Management API

## Overview
The Formulation Management API provides comprehensive functionality for managing product formulations with versioning, ingredient management, approval locking, and rollback capabilities. This system allows manufacturers to maintain multiple versions of product recipes while ensuring quality control through approval workflows.

## Features
- ✅ **Formulation Creation**: Create new product formulations with initial ingredients
- ✅ **Version Management**: Maintain multiple versions (V1, V2, V3...) of each formulation
- ✅ **Ingredient Management**: Add, modify, and track ingredient compositions and percentages
- ✅ **Approval Workflow**: Lock/unlock versions for production approval
- ✅ **Version Comparison**: Compare any two versions to see ingredient changes
- ✅ **Rollback Functionality**: Revert to previous versions when needed
- ✅ **Audit Trail**: Track creator, creation date, and modification history

## API Endpoints

### Base URL
```
http://localhost:3000/api/formulations
```

---

## 1. Create New Formulation

**Endpoint:** `POST /formulations`

**Description:** Creates a new product formulation with its first version (V1).

**Request Body:**
```json
{
  "productName": "Herbal Face Cream",
  "initialIngredients": [
    {
      "materialId": "material_123",
      "percentageOrComposition": 25.5,
      "unit": "%",
      "notes": "Main active ingredient"
    },
    {
      "materialId": "material_456",
      "percentageOrComposition": 15.0,
      "unit": "%",
      "notes": "Emollient base"
    },
    {
      "materialId": "material_789",
      "percentageOrComposition": 59.5,
      "unit": "%",
      "notes": "Water and preservatives"
    }
  ],
  "creatorId": "user_123"
}
```

**Response (201 Created):**
```json
{
  "message": "Formulation created successfully",
  "formulation": {
    "id": "form_123",
    "productName": "Herbal Face Cream",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "versions": [
      {
        "id": "ver_123",
        "versionNumber": 1,
        "isLocked": false,
        "creatorId": "user_123",
        "creationDate": "2024-01-15T10:30:00Z",
        "notes": "Initial version",
        "ingredients": [
          {
            "id": "ing_123",
            "materialId": "material_123",
            "percentageOrComposition": 25.5,
            "unit": "%",
            "notes": "Main active ingredient",
            "material": {
              "id": "material_123",
              "name": "Aloe Vera Extract",
              "type": "Active Ingredient"
            }
          }
        ]
      }
    ]
  }
}
```

---

## 2. Create New Version

**Endpoint:** `POST /formulations/:formulationId/versions`

**Description:** Creates a new version of an existing formulation.

**Request Body:**
```json
{
  "ingredients": [
    {
      "materialId": "material_123",
      "percentageOrComposition": 30.0,
      "unit": "%",
      "notes": "Increased concentration"
    },
    {
      "materialId": "material_456",
      "percentageOrComposition": 10.0,
      "unit": "%",
      "notes": "Reduced for balance"
    },
    {
      "materialId": "material_789",
      "percentageOrComposition": 60.0,
      "unit": "%",
      "notes": "Adjusted water content"
    }
  ],
  "notes": "Optimized for sensitive skin",
  "creatorId": "user_123"
}
```

**Response (201 Created):**
```json
{
  "message": "Version 2 created successfully",
  "version": {
    "id": "ver_124",
    "versionNumber": 2,
    "isLocked": false,
    "creatorId": "user_123",
    "creationDate": "2024-01-16T14:20:00Z",
    "notes": "Optimized for sensitive skin",
    "ingredients": [...]
  }
}
```

---

## 3. Get All Formulations

**Endpoint:** `GET /formulations`

**Description:** Retrieves all formulations with their versions and ingredients.

**Query Parameters:**
- `locked` (optional): Filter by locked status
  - `locked=true`: Only formulations with locked versions
  - `locked=false`: Only formulations with no locked versions
  - No parameter: All formulations

**Example Requests:**
```bash
# Get all formulations
GET /formulations

# Get only formulations with locked versions
GET /formulations?locked=true

# Get only formulations with no locked versions
GET /formulations?locked=false
```

**Response (200 OK):**
```json
{
  "formulations": [
    {
      "id": "form_123",
      "productName": "Herbal Face Cream",
      "versions": [
        {
          "versionNumber": 2,
          "isLocked": true,
          "ingredients": [...]
        },
        {
          "versionNumber": 1,
          "isLocked": false,
          "ingredients": [...]
        }
      ]
    }
  ],
  "totalCount": 1
}
```

---

## 4. Get Specific Formulation

**Endpoint:** `GET /formulations/:formulationId`

**Description:** Retrieves a specific formulation with all its versions and ingredients.

**Response (200 OK):**
```json
{
  "formulation": {
    "id": "form_123",
    "productName": "Herbal Face Cream",
    "versions": [
      {
        "versionNumber": 2,
        "isLocked": true,
        "creator": {
          "id": "user_123",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@company.com"
        },
        "ingredients": [...]
      }
    ]
  }
}
```

---

## 5. Get Specific Version

**Endpoint:** `GET /formulations/:formulationId/versions/:versionNumber`

**Description:** Retrieves a specific version of a formulation.

**Example:**
```bash
GET /formulations/form_123/versions/2
```

**Response (200 OK):**
```json
{
  "version": {
    "id": "ver_124",
    "versionNumber": 2,
    "isLocked": true,
    "creator": {
      "id": "user_123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@company.com"
    },
    "ingredients": [...]
  }
}
```

---

## 6. Lock/Unlock Version

**Endpoint:** `PATCH /formulations/:formulationId/versions/:versionNumber/lock`

**Description:** Locks or unlocks a version for approval/production use.

**Request Body:**
```json
{
  "isLocked": true,
  "notes": "Approved for production by QA team"
}
```

**Response (200 OK):**
```json
{
  "message": "Version 2 locked successfully",
  "version": {
    "id": "ver_124",
    "isLocked": true,
    "notes": "Approved for production by QA team"
  }
}
```

---

## 7. Compare Versions

**Endpoint:** `GET /formulations/:formulationId/compare?version1=1&version2=2`

**Description:** Compares two versions to show ingredient differences.

**Example:**
```bash
GET /formulations/form_123/compare?version1=1&version2=2
```

**Response (200 OK):**
```json
{
  "comparison": {
    "version1": {
      "versionNumber": 1,
      "creationDate": "2024-01-15T10:30:00Z",
      "isLocked": false,
      "ingredients": [...]
    },
    "version2": {
      "versionNumber": 2,
      "creationDate": "2024-01-16T14:20:00Z",
      "isLocked": true,
      "ingredients": [...]
    },
    "differences": {
      "ingredientChanges": [
        {
          "type": "modified",
          "materialId": "material_123",
          "materialName": "Aloe Vera Extract",
          "v1Value": 25.5,
          "v1Unit": "%",
          "v2Value": 30.0,
          "v2Unit": "%"
        },
        {
          "type": "modified",
          "materialId": "material_456",
          "materialName": "Emollient Base",
          "v1Value": 15.0,
          "v1Unit": "%",
          "v2Value": 10.0,
          "v2Unit": "%"
        }
      ],
      "totalIngredientsV1": 3,
      "totalIngredientsV2": 3
    }
  }
}
```

**Change Types:**
- `added`: New ingredient in version 2
- `removed`: Ingredient removed in version 2
- `modified`: Ingredient composition changed between versions

---

## 8. Rollback to Previous Version

**Endpoint:** `POST /formulations/:formulationId/rollback/:versionNumber`

**Description:** Creates a new version based on a previous version (rollback functionality).

**Request Body:**
```json
{
  "notes": "Rolling back due to stability issues in V3",
  "creatorId": "user_123"
}
```

**Example:**
```bash
POST /formulations/form_123/rollback/2
```

**Response (201 Created):**
```json
{
  "message": "Rollback to version 2 completed. New version 4 created.",
  "version": {
    "id": "ver_126",
    "versionNumber": 4,
    "isLocked": false,
    "notes": "Rollback to version 2: Rolling back due to stability issues in V3",
    "ingredients": [...]
  }
}
```

---

## 9. Update Ingredients

**Endpoint:** `PUT /formulations/:formulations/:formulationId/versions/:versionNumber/ingredients`

**Description:** Updates ingredients for a specific version (only if not locked).

**Request Body:**
```json
{
  "ingredients": [
    {
      "materialId": "material_123",
      "percentageOrComposition": 28.0,
      "unit": "%",
      "notes": "Fine-tuned concentration"
    },
    {
      "materialId": "material_456",
      "percentageOrComposition": 12.0,
      "unit": "%",
      "notes": "Adjusted for texture"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "message": "Ingredients updated successfully",
  "version": {
    "id": "ver_124",
    "ingredients": [...]
  }
}
```

---

## Data Models

### Formulation
```typescript
{
  id: string;
  productName: string;
  versions: FormulationVersion[];
  createdAt: Date;
  updatedAt: Date;
}
```

### FormulationVersion
```typescript
{
  id: string;
  formulationId: string;
  versionNumber: number;
  isLocked: boolean;
  creatorId: string;
  creationDate: Date;
  notes?: string;
  ingredients: FormulationIngredient[];
}
```

### FormulationIngredient
```typescript
{
  id: string;
  formulationVersionId: string;
  materialId: string;
  percentageOrComposition: number;
  unit: string;
  notes?: string;
  material: StockManagement; // Related material details
}
```

---

## Usage Examples

### Complete Workflow Example

1. **Create Formulation**
```bash
curl -X POST http://localhost:3000/api/formulations \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Biotin Gummy V1",
    "initialIngredients": [
      {"materialId": "mat_001", "percentageOrComposition": 5.0, "unit": "%", "notes": "Biotin"},
      {"materialId": "mat_002", "percentageOrComposition": 95.0, "unit": "%", "notes": "Gummy base"}
    ]
  }'
```

2. **Create New Version**
```bash
curl -X POST http://localhost:3000/api/formulations/form_123/versions \
  -H "Content-Type: application/json" \
  -d '{
    "ingredients": [
      {"materialId": "mat_001", "percentageOrComposition": 7.5, "unit": "%", "notes": "Increased Biotin"},
      {"materialId": "mat_002", "percentageOrComposition": 92.5, "unit": "%", "notes": "Adjusted base"}
    ],
    "notes": "Higher potency version"
  }'
```

3. **Lock Version for Production**
```bash
curl -X PATCH http://localhost:3000/api/formulations/form_123/versions/2/lock \
  -H "Content-Type: application/json" \
  -d '{"isLocked": true, "notes": "Approved for production"}'
```

4. **Compare Versions**
```bash
curl "http://localhost:3000/api/formulations/form_123/compare?version1=1&version2=2"
```

---

## Error Handling

All endpoints return appropriate HTTP status codes and error messages:

- **400 Bad Request**: Invalid input data
- **404 Not Found**: Formulation or version not found
- **500 Internal Server Error**: Server-side errors

**Error Response Format:**
```json
{
  "error": "Error description",
  "details": "Additional error details"
}
```

---

## Best Practices

1. **Version Naming**: Use descriptive notes for each version
2. **Approval Workflow**: Lock versions only after thorough testing
3. **Ingredient Tracking**: Maintain detailed notes for each ingredient
4. **Rollback Strategy**: Document reasons for rollbacks
5. **Regular Reviews**: Periodically review and clean up old versions

---

## Integration Notes

- **Authentication**: Currently uses `creatorId` from request body (implement proper auth middleware)
- **Validation**: Add input validation for ingredient percentages and units
- **Audit Logging**: Consider adding comprehensive audit trails
- **Batch Integration**: Formulations can be linked to production batches
- **Stock Management**: Ingredients reference materials from stock management system

---

## Next Steps

- [ ] Add authentication middleware
- [ ] Implement ingredient validation rules
- [ ] Add bulk operations for multiple formulations
- [ ] Create formulation templates
- [ ] Add export/import functionality
- [ ] Implement approval workflow notifications

---

## 🧪 Testing Guide

### Prerequisites

Before testing the Formulation API, ensure you have:

1. **Backend server running** on `http://localhost:3000`
2. **Database connected** and Prisma schema synced
3. **Authentication token** from login/signup
4. **Test materials** created in the stock management system

### Step 1: Create Test Materials

First, create materials that will be used in formulations:

#### **Material 1: Test Herb**
**POST** `http://localhost:3000/api/stock/materials`
```json
{
  "name": "Test Herb",
  "type": "Raw",
  "unit": "kg",
  "currentStockQty": 25,
  "minThresholdQty": 10,
  "supplierName": "Test Supplier",
  "billNumber": "TEST-001",
  "quantity": 25,
  "purchaseDate": "2024-01-15",
  "costPerUnit": 15.00
}
```

#### **Material 2: Shea Butter**
**POST** `http://localhost:3000/api/stock/materials`
```json
{
  "name": "Shea Butter",
  "type": "Raw",
  "unit": "kg",
  "currentStockQty": 20,
  "minThresholdQty": 8,
  "supplierName": "Natural Oils Co.",
  "billNumber": "SB-2024-001",
  "quantity": 20,
  "purchaseDate": "2024-01-15",
  "costPerUnit": 28.50
}
```

#### **Material 3: Coconut Oil**
**POST** `http://localhost:3000/api/stock/materials`
```json
{
  "name": "Coconut Oil",
  "type": "Raw",
  "unit": "L",
  "currentStockQty": 15,
  "minThresholdQty": 5,
  "supplierName": "Tropical Oils Ltd.",
  "billNumber": "CO-2024-002",
  "quantity": 15,
  "purchaseDate": "2024-01-15",
  "costPerUnit": 12.75
}
```

### Step 2: Get Material IDs

After creating materials, get their IDs:

**GET** `http://localhost:3000/api/stock/materials`

Save the returned IDs for use in formulations.

### Step 3: Test Formulation Creation

#### **Create First Formulation**
**POST** `http://localhost:3000/api/formulations`
```json
{
  "productName": "Herbal Face Cream",
  "initialIngredients": [
    {
      "materialId": "MATERIAL_ID_1",
      "percentageOrComposition": 25.5,
      "unit": "%",
      "notes": "Test Herb - Main active ingredient"
    },
    {
      "materialId": "MATERIAL_ID_2",
      "percentageOrComposition": 15.0,
      "unit": "%",
      "notes": "Shea Butter - Moisturizing base"
    },
    {
      "materialId": "MATERIAL_ID_3",
      "percentageOrComposition": 59.5,
      "unit": "%",
      "notes": "Coconut Oil - Carrier oil"
    }
  ]
}
```

**Expected Response:** `201 Created` with formulation details

### Step 4: Test Version Management

#### **Create Second Version**
**POST** `http://localhost:3000/api/formulations/{FORMULATION_ID}/versions`
```json
{
  "ingredients": [
    {
      "materialId": "MATERIAL_ID_1",
      "percentageOrComposition": 30.0,
      "unit": "%",
      "notes": "Test Herb - Increased concentration"
    },
    {
      "materialId": "MATERIAL_ID_2",
      "percentageOrComposition": 20.0,
      "unit": "%",
      "notes": "Shea Butter - Enhanced moisturizing"
    },
    {
      "materialId": "MATERIAL_ID_3",
      "percentageOrComposition": 50.0,
      "unit": "%",
      "notes": "Coconut Oil - Reduced for balance"
    }
  ],
  "notes": "Version 2 - Enhanced formula with higher active ingredient concentrations"
}
```

### Step 5: Test Approval Workflow

#### **Lock Version for Production**
**PATCH** `http://localhost:3000/api/formulations/{FORMULATION_ID}/versions/2/lock`
```json
{
  "isLocked": true,
  "notes": "Approved for production by QA team"
}
```

### Step 6: Test Retrieval Endpoints

#### **Get All Formulations**
**GET** `http://localhost:3000/api/formulations`

#### **Get Specific Formulation**
**GET** `http://localhost:3000/api/formulations/{FORMULATION_ID}`

#### **Get Specific Version**
**GET** `http://localhost:3000/api/formulations/{FORMULATION_ID}/versions/2`

### Step 7: Test Advanced Features

#### **Compare Versions**
**GET** `http://localhost:3000/api/formulations/{FORMULATION_ID}/compare?version1=1&version2=2`

#### **Rollback to Previous Version**
**POST** `http://localhost:3000/api/formulations/{FORMULATION_ID}/rollback/1`
```json
{
  "notes": "Rolling back to stable version 1"
}
```

#### **Update Ingredients (if version not locked)**
**PUT** `http://localhost:3000/api/formulations/{FORMULATION_ID}/versions/1/ingredients`
```json
{
  "ingredients": [
    {
      "materialId": "MATERIAL_ID_1",
      "percentageOrComposition": 28.0,
      "unit": "%",
      "notes": "Fine-tuned concentration"
    }
  ]
}
```

### Step 8: Test Edge Cases

#### **Create Formulation with Duplicate Name**
**POST** `http://localhost:3000/api/formulations`
```json
{
  "productName": "Herbal Face Cream",
  "initialIngredients": []
}
```
**Expected Response:** `400 Bad Request` - "Formulation with this product name already exists"

#### **Lock Already Locked Version**
**PATCH** `http://localhost:3000/api/formulations/{FORMULATION_ID}/versions/2/lock`
```json
{
  "isLocked": true,
  "notes": "Already locked version"
}
```

#### **Update Locked Version Ingredients**
**PUT** `http://localhost:3000/api/formulations/{FORMULATION_ID}/versions/2/ingredients`
```json
{
  "ingredients": []
}
```
**Expected Response:** `400 Bad Request` - "Cannot modify locked version"

### Postman Collection Setup

#### **Environment Variables**
Create a Postman environment with these variables:
```
BASE_URL: http://localhost:3000
AUTH_TOKEN: your_jwt_token_here
FORMULATION_ID: (will be set after creation)
MATERIAL_ID_1: (from stock creation)
MATERIAL_ID_2: (from stock creation)
MATERIAL_ID_3: (from stock creation)
```

#### **Pre-request Scripts**
For endpoints requiring authentication, add this pre-request script:
```javascript
pm.request.headers.add({
    key: 'Authorization',
    value: 'Bearer ' + pm.environment.get('AUTH_TOKEN')
});
```

#### **Tests Scripts**
Add basic response validation:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has required fields", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('formulations');
});
```

### Testing Checklist

- [ ] **Authentication**: All protected endpoints require valid JWT token
- [ ] **Input Validation**: Required fields are properly validated
- [ ] **Business Logic**: Formulation names must be unique
- [ ] **Version Control**: Version numbers auto-increment
- [ ] **Approval Workflow**: Locked versions cannot be modified
- [ ] **Data Integrity**: Foreign key constraints are enforced
- [ ] **Error Handling**: Appropriate HTTP status codes and error messages
- [ ] **Response Format**: Consistent JSON response structure

### Troubleshooting Common Issues

#### **401 Unauthorized**
- Check JWT token validity and expiration
- Verify Authorization header format: `Bearer {token}`
- Ensure token is not expired

#### **400 Bad Request**
- Validate all required fields are present
- Check data types (numbers vs strings)
- Verify enum values match schema (StockType: Raw, Packaging, Consumable)

#### **404 Not Found**
- Verify formulation ID exists
- Check version number is valid
- Ensure material ID exists in stock management

#### **500 Internal Server Error**
- Check server logs for detailed error information
- Verify database connection
- Check Prisma schema is synced

#### **Foreign Key Constraint Violation**
- Ensure material IDs exist before creating formulations
- Check database relationships are properly configured
- Verify Prisma schema matches database structure

### Performance Testing

#### **Load Testing**
- Test with multiple concurrent requests
- Monitor response times
- Check database performance under load

#### **Data Volume Testing**
- Create formulations with many ingredients
- Test with large numbers of versions
- Verify pagination works for large datasets

### Security Testing

#### **Authentication Bypass**
- Test endpoints without authentication tokens
- Verify expired tokens are rejected
- Check role-based access control

#### **Input Validation**
- Test with malformed JSON
- Verify SQL injection protection
- Check XSS prevention

### Integration Testing

#### **End-to-End Workflow**
1. Create materials → Create formulation → Create version → Lock version → Compare versions
2. Test rollback functionality
3. Verify audit trail completeness

#### **Cross-System Integration**
- Test stock management integration
- Verify user management integration
- Check batch production integration

This comprehensive testing guide ensures your Formulation API is robust, secure, and ready for production use.
