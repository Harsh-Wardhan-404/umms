# Batch Manufacturing System - Setup & Usage Guide

## Overview

The Batch Manufacturing module provides a comprehensive solution for managing production batches, including real-time inventory deduction, QR code generation, worker assignment, photo uploads, quality checks, and detailed reporting.

## Features Implemented

### 1. **Batch List Page** (`/production/batch-production`)
- View all batches with status, shift, and timing information
- Search by batch code or product name
- Filter by status, shift, and date range
- Quick access to QR codes and batch details
- Status-based color coding

### 2. **Create Batch Wizard** (3-Step Process)

#### Step 1: Select Formulation
- Choose from locked formulation versions only
- Enter batch size
- Auto-calculate ingredient requirements
- Real-time material availability check
- Visual indicators for stock shortages

#### Step 2: Workers & Shift
- Select multiple workers (Staff/Supervisor roles)
- Choose shift (Morning/Evening/Night)
- Set production start time
- Add production notes
- Supervisor auto-assigned from logged-in user

#### Step 3: Review & Confirm
- Complete summary of batch details
- Material requirements table
- Worker and shift confirmation
- Automatic material deduction on creation
- QR code generated immediately

### 3. **Batch Details Page** (`/production/batch-production/:id`)

#### Information Sections:
- **Batch Information**: Code, size, supervisor, workers, shift, timings
- **Materials Used**: Detailed breakdown of deducted materials
- **Photos**: Organized by type (Before/After Packaging, Quality Check, General)
- **Quality Checks**: Track inspection results with pass/fail status
- **Production Report**: Link to comprehensive report

#### Actions Available:
- View/Print QR Code
- Update batch status
- Upload photos (file or camera)
- Add quality checks
- Generate production report

### 4. **QR Code System**
- Auto-generated unique QR codes for each batch
- Display modal with print and download options
- 300x300px high-quality codes with error correction
- Includes batch code below QR for manual reference

### 5. **Photo Upload**
- Multiple upload methods:
  - File picker (JPG, PNG, WebP)
  - Camera capture (web camera integration)
- Photo type categorization
- Optional notes
- Preview before upload
- Max 10MB per file, max 10 photos at once

### 6. **Quality Control**
- Pre-defined check types (Visual, Weight, pH, etc.)
- Custom check type support
- Pass/Fail result recording
- Inspector auto-filled from logged-in user
- Detailed notes for each check
- Timeline view of all checks

### 7. **Production Reports** (`/production/batch-production/:id/report`)
- Comprehensive batch analysis
- Material usage breakdown with costs (if available)
- Quality check summary with pass rate
- Production timeline
- Worker assignments
- Print-friendly layout
- Performance metrics

## Component Architecture

```
BatchProduction/
├── BatchProduction.tsx          # Main list page
├── CreateBatchWizard.tsx        # Wizard container
├── BatchDetails.tsx             # Batch details page
├── ProductionReport.tsx         # Report viewer
├── wizard/
│   ├── FormulationSelector.tsx   # Step 1
│   ├── WorkerShiftSelector.tsx   # Step 2
│   └── BatchReviewConfirm.tsx    # Step 3
└── components/
    ├── QRCodeDisplay.tsx         # QR modal
    ├── PhotoUpload.tsx           # Photo upload modal
    ├── StatusUpdateModal.tsx     # Status update modal
    └── QualityCheckForm.tsx      # Quality check form
```

## API Integration

### Backend Endpoints Used:

1. **GET** `/api/batches` - List all batches with filters
2. **POST** `/api/batches` - Create new batch (auto-deducts materials)
3. **GET** `/api/batches/:id` - Get batch details
4. **PATCH** `/api/batches/:id/status` - Update batch status
5. **POST** `/api/batches/:id/photos` - Upload photos (multipart/form-data)
6. **POST** `/api/batches/:id/quality-checks` - Add quality check
7. **GET** `/api/batches/:id/report` - Get production report
8. **GET** `/api/formulations?locked=true` - Get locked formulations
9. **GET** `/api/users` - Get workers/supervisors

### Data Flow:

```
Create Batch Wizard
  ↓
1. Fetch locked formulations from API
  ↓
2. Calculate ingredient requirements (client-side)
  ↓
3. Check material availability (from formulation data)
  ↓
4. Select workers and shift details
  ↓
5. Review and confirm
  ↓
6. POST /api/batches (backend auto-deducts materials)
  ↓
7. Display QR code and navigate to batch details
```

## Installation & Setup

### 1. Install Dependencies

```bash
npm install qrcode.react react-webcam
```

### 2. Backend Requirements

- Ensure batch API endpoints are active
- Verify authentication middleware is configured
- Check file upload directory exists: `uploads/batches/`
- Confirm role-based access control is working

### 3. Frontend Routes

Routes are automatically configured in `Home.tsx`:
- `/production/batch-production` - List page
- `/production/batch-production/create` - Create wizard
- `/production/batch-production/:id` - Batch details
- `/production/batch-production/:id/report` - Production report

## Usage Guide

### Creating a Batch

1. Navigate to **Production → Batch Production**
2. Click **Create Batch** button
3. **Step 1**: Select a formulation and enter batch size
   - Only locked versions are available
   - System calculates ingredient requirements automatically
   - Material availability is checked in real-time
4. **Step 2**: Select workers and shift
   - Choose one or more workers
   - Select shift (Morning/Evening/Night)
   - Set start time (cannot be in the past)
   - Add optional production notes
5. **Step 3**: Review and confirm
   - Verify all details
   - Click **Confirm & Create Batch**
   - Materials are automatically deducted
   - QR code is generated
   - Navigate to batch details

### Managing a Batch

1. **Update Status**: Click "Update Status" button
   - Change from Planned → InProgress → QualityCheck → Completed
   - Add end time when marking as Completed
   - Add status update notes

2. **Upload Photos**: Click "Upload Photos" button
   - Choose file upload or camera capture
   - Select photo type (Before/After/Quality Check/General)
   - Add optional notes
   - Upload up to 10 photos at once

3. **Add Quality Checks**: Click "Add Quality Check" button
   - Select check type or enter custom
   - Mark as Pass or Fail
   - Add detailed notes (required)
   - Inspector is auto-filled

4. **View QR Code**: Click "View QR" button
   - Display QR code in modal
   - Print for packaging/labels
   - Download as PNG file

5. **Generate Report**: Click "View Report" button
   - Comprehensive production analysis
   - Material usage and costs
   - Quality check summary
   - Production timeline
   - Print-friendly format

## Role-Based Access

- **Admin**: Full access to all batch operations
- **InventoryManager**: Full access to all batch operations
- **ProductionManager**: Full access to all batch operations
- **Supervisor**: Can view, create, and update batches
- **Staff**: Limited access (configurable)

## Validation Rules

### Batch Creation:
- ✓ Formulation version must be locked
- ✓ Batch size must be > 0
- ✓ At least 1 worker must be selected
- ✓ Start time cannot be in the past
- ✓ Sufficient materials must be in stock

### Photo Upload:
- ✓ Max file size: 10MB
- ✓ Accepted formats: JPG, PNG, WebP
- ✓ Max 10 photos per upload

### Quality Check:
- ✓ Check type required
- ✓ Result (pass/fail) required
- ✓ Notes required (recommended to be detailed)

## Troubleshooting

### Issue: "Insufficient materials in stock"
- **Solution**: Check raw material inventory. Add stock via Inventory → Raw Materials before creating batch.

### Issue: "No locked formulation versions available"
- **Solution**: Go to Formulations & R&D, open the formulation, and lock the desired version.

### Issue: Photo upload fails
- **Solution**: Check file size (<10MB) and format (JPG/PNG/WebP). Ensure backend `uploads/batches/` directory exists.

### Issue: Camera not working
- **Solution**: Grant camera permissions in browser. Use HTTPS for production deployments.

### Issue: QR code not displaying
- **Solution**: Ensure `qrcode.react` package is installed. Check browser console for errors.

## Technical Details

### QR Code Implementation
- Library: `qrcode.react`
- Size: 300x300px (default), 400x400px (print)
- Error Correction: High (Level H)
- Data: Batch code string

### Photo Storage
- Backend: Multer with disk storage
- Location: `uploads/batches/`
- Filename format: `{timestamp}-{uuid}.{ext}`
- Metadata stored in database as JSON array

### Material Deduction
- Automatic on batch creation
- Uses formulation percentages × batch size
- Transaction-based for data integrity
- Rollback on creation failure

## Performance Considerations

- Batch list paginated (future enhancement)
- Photos lazy-loaded
- Material calculations done client-side
- QR codes generated on-demand
- Reports cached for 5 minutes (backend)

## Future Enhancements (Not in Current Scope)

- PDF report generation
- Real-time batch monitoring dashboard
- Worker efficiency tracking per batch
- Material wastage tracking
- Batch-to-batch comparison analytics
- Mobile-optimized PWA for shop floor
- Barcode scanner integration
- Automated notifications for status changes

## Support

For issues or questions:
1. Check console logs for errors
2. Verify backend API is running
3. Confirm authentication is working
4. Review role permissions
5. Check network requests in DevTools

## API Response Examples

### GET /api/batches/:id

```json
{
  "success": true,
  "batch": {
    "id": "cm123...",
    "batchCode": "HER-ABC123-XYZ",
    "productName": "Herbal Face Cream",
    "status": "InProgress",
    "batchSize": 100,
    "supervisor": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "materialsUsed": [...],
    "photos": [...],
    "qualityChecks": [...]
  }
}
```

### POST /api/batches

```json
{
  "productName": "Herbal Face Cream",
  "formulationVersionId": "cm456...",
  "batchSize": 100,
  "workers": ["cm789...", "cm012..."],
  "shift": "Morning",
  "startTime": "2024-11-24T09:00:00Z",
  "productionNotes": "Standard production"
}
```

Response:
```json
{
  "success": true,
  "batch": {
    "id": "cm123...",
    "batchCode": "HER-ABC123-XYZ",
    "qrCodeData": "HER-ABC123-XYZ",
    ...
  }
}
```

---

**Last Updated**: November 24, 2024  
**Version**: 1.0.0  
**Module**: Batch Manufacturing System

