# UMMS Backend - Unified Manufacturing Management System

A comprehensive backend API for managing manufacturing operations including stock management, inventory tracking, and production workflows.

## 🚀 Features

### Stock Management
- **Add new raw materials** with supplier details, bill numbers, quantities, and costs
- **Upload scanned purchase bills** (PDF/Images) with automatic file management
- **View current stock levels** with real-time alerts for minimum thresholds
- **Stock types**: Raw (Herbs, Extracts, Actives), Packaging (Bottles, Jars, Labels), Consumables
- **Stock operations**: Add/subtract quantities with validation
- **Low stock alerts** with urgency levels (Critical/Warning)

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **File Upload**: Multer with PDF/Image support
- **Validation**: Built-in request validation
- **CORS**: Enabled for frontend integration

## 📋 Prerequisites

- Node.js >= 18.17 (LTS) or >= 20.x
- PostgreSQL database
- npm >= 9

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd umms_backend
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/umms_db"

# Server Configuration
PORT=3000
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### 3. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or create migrations (for production)
npm run db:migrate
```

### 4. Start Development Server
```bash
# Development mode with auto-restart
npm run dev:watch

# Or single run
npm run dev
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Stock Management Endpoints

#### 1. Add New Material
```http
POST /api/stock/materials
Content-Type: application/json

{
  "name": "Herbal Extract X",
  "type": "Raw",
  "unit": "kg",
  "currentStockQty": 100,
  "minThresholdQty": 20,
  "supplierName": "ABC Suppliers",
  "billNumber": "BILL-001",
  "quantity": 100,
  "purchaseDate": "2024-01-15",
  "costPerUnit": 25.50
}
```

#### 2. Upload Purchase Bill
```http
POST /api/stock/materials/{materialId}/upload-bill
Content-Type: multipart/form-data

bill: [PDF/Image file]
billNumber: BILL-001
```

#### 3. View All Materials
```http
GET /api/stock/materials
GET /api/stock/materials?type=Raw
GET /api/stock/materials?lowStock=true
```

#### 4. Get Material Details
```http
GET /api/stock/materials/{materialId}
```

#### 5. Update Stock Quantity
```http
PATCH /api/stock/materials/{materialId}/stock
Content-Type: application/json

{
  "quantity": 50,
  "operation": "add"
}
```

#### 6. Stock Types Summary
```http
GET /api/stock/stock-types
```

#### 7. Low Stock Alerts
```http
GET /api/stock/alerts/low-stock
```

## 📁 Project Structure

```
umms_backend/
├── src/
│   ├── routes/
│   │   └── stockRoutes.ts      # Stock management endpoints
│   ├── controllers/             # Business logic (future)
│   ├── middleware/              # Custom middleware (future)
│   ├── utils/                   # Utility functions (future)
│   └── index.ts                 # Main server file
├── prisma/
│   └── schema.prisma           # Database schema
├── uploads/                     # File upload directory
├── dist/                        # Compiled JavaScript
└── package.json
```

## 🔧 Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run dev` - Start development server
- `npm run dev:watch` - Start with auto-restart
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Create database migrations
- `npm run db:studio` - Open Prisma Studio

## 📊 Database Schema

The system includes comprehensive models for:
- **Users** - Role-based access control
- **Stock Management** - Materials, quantities, thresholds
- **Formulations** - Product recipes with versioning
- **Batches** - Production tracking with QR codes
- **Finished Goods** - Inventory management
- **Invoices** - Sales and billing
- **Dispatch** - Shipping and delivery
- **Feedback** - Client satisfaction tracking
- **Worker Efficiency** - Performance metrics
- **Profit & Loss** - Financial reporting

## 🚨 Low Stock Alerts

The system automatically monitors stock levels and provides:
- **Warning Alerts**: When stock is below minimum threshold
- **Critical Alerts**: When stock is completely depleted
- **Real-time Updates**: Stock status changes trigger immediate alerts

## 📁 File Management

- **Supported Formats**: PDF, JPG, PNG, GIF
- **File Size Limit**: 10MB per file
- **Storage**: Local file system with organized naming
- **Access**: Files served via `/uploads` endpoint

## 🔒 Security Features

- **Input Validation**: Comprehensive request validation
- **File Type Filtering**: Only allowed file types accepted
- **File Size Limits**: Prevents abuse
- **Error Handling**: Secure error messages without data leakage

## 🧪 Testing the API

### Health Check
```bash
curl http://localhost:3000/health
```

### Add Material Example
```bash
curl -X POST http://localhost:3000/api/stock/materials \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Herb",
    "type": "Raw",
    "unit": "kg",
    "currentStockQty": 50,
    "minThresholdQty": 10,
    "supplierName": "Test Supplier",
    "billNumber": "TEST-001",
    "quantity": 50,
    "purchaseDate": "2024-01-15",
    "costPerUnit": 15.00
  }'
```

## 🚀 Next Steps

- [ ] Authentication & Authorization
- [ ] Formulation Management API
- [ ] Batch Production API
- [ ] Invoice & Billing API
- [ ] Worker Efficiency Tracking
- [ ] Financial Reporting
- [ ] API Rate Limiting
- [ ] Request Logging
- [ ] Unit Tests
- [ ] Integration Tests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For issues and questions:
1. Check the API documentation
2. Review error logs
3. Create an issue in the repository
4. Contact the development team

