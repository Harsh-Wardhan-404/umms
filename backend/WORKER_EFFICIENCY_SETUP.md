# Worker Efficiency & Ratings System - Setup Guide

## Overview

The Worker Efficiency & Ratings System automatically tracks worker performance based on:
- **Output efficiency**: Actual output vs standard output per shift
- **Punctuality**: On-time batch completion percentage
- **Supervisor feedback**: Positive and negative feedback tags

Workers receive a **1-5 star rating** with exportable monthly PDF and Excel reports.

---

## Table of Contents

1. [Database Schema](#database-schema)
2. [Efficiency Calculation Formula](#efficiency-calculation-formula)
3. [API Endpoints](#api-endpoints)
4. [Frontend Pages](#frontend-pages)
5. [Setup Instructions](#setup-instructions)
6. [Usage Workflow](#usage-workflow)
7. [Permissions](#permissions)
8. [Troubleshooting](#troubleshooting)

---

## Database Schema

### WorkerEfficiency Model

```prisma
model WorkerEfficiency {
  id                        String   @id @default(cuid())
  userId                    String   @unique
  standardOutputQtyPerShift Float    @default(0)
  punctualityScore          Float    @default(0)
  efficiencyRating          Float    @default(0)
  batchHistory              String[] // Array of batch IDs
  totalBatchesCompleted     Int      @default(0)
  onTimeBatches             Int      @default(0)
  feedbackTags              Json?    // Positive and negative counts
  lastCalculated            DateTime @default(now())
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt

  user User @relation(...)
}
```

### WorkerFeedback Model

```prisma
model WorkerFeedback {
  id          String   @id @default(cuid())
  workerId    String
  batchId     String
  supervisorId String
  feedbackTag String   // "Excellent", "Good", "Needs Improvement", "Late"
  comments    String?
  createdAt   DateTime @default(now())

  worker     User @relation("WorkerFeedbacks", ...)
  supervisor User @relation("SupervisorFeedbacks", ...)
}
```

---

## Efficiency Calculation Formula

### Overall Score Calculation

```typescript
// 1. Output Efficiency (40% weight)
outputEfficiency = (averageActualOutput / standardOutput) * 100

// 2. Punctuality Score (40% weight)
punctualityScore = (onTimeBatches / totalBatches) * 100

// 3. Feedback Score (20% weight)
feedbackScore = ((positiveCount - negativeCount) / totalFeedbacks) * 50 + 50

// 4. Overall Score
overallScore = (outputEfficiency * 0.4) + (punctualityScore * 0.4) + (feedbackScore * 0.2)

// 5. Convert to Stars (1-5)
starRating = Math.ceil((overallScore / 100) * 5)
```

### Star Rating Ranges

| Score Range | Stars | Label |
|-------------|-------|-------|
| 0-20% | ⭐ 1 | Needs Improvement |
| 21-40% | ⭐⭐ 2 | Below Average |
| 41-60% | ⭐⭐⭐ 3 | Average |
| 61-80% | ⭐⭐⭐⭐ 4 | Good |
| 81-100% | ⭐⭐⭐⭐⭐ 5 | Excellent |

### Punctuality Calculation

- A batch is considered "On Time" if completed within 12 hours (standard shift duration + buffer)
- Buffer: 10% over expected time still counts as on-time

### Feedback Tags

**Positive Tags:**
- ✅ Excellent
- ✅ Good

**Negative Tags:**
- ⚠️ Needs Improvement
- ⚠️ Late

---

## API Endpoints

### Base URL: `/api/worker-efficiency`

#### 1. Get All Workers

```http
GET /api/worker-efficiency
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)
- `sortBy`: Sort field (`efficiencyRating`, `punctualityScore`, `name`)
- `sortOrder`: `asc` or `desc`
- `minRating`: Minimum rating filter (0-5)
- `maxRating`: Maximum rating filter (0-5)
- `role`: Filter by role

**Response:**
```json
{
  "data": [...],
  "pagination": { "total": 50, "page": 1, "limit": 20, "totalPages": 3 },
  "stats": {
    "totalWorkers": 50,
    "avgEfficiency": "78.5",
    "topPerformer": { "id": "...", "name": "John Doe", "rating": 4.8 },
    "needAttention": 5
  }
}
```

#### 2. Get Worker Details

```http
GET /api/worker-efficiency/:userId
```

**Response:**
```json
{
  "worker": { "id": "...", "name": "John Doe", ... },
  "efficiency": {
    "outputEfficiency": 85.2,
    "punctualityScore": 90.0,
    "feedbackScore": 75.0,
    "overallRating": 4.5,
    "totalBatches": 25,
    "onTimeBatches": 22,
    "positiveFeedbackCount": 15,
    "negativeFeedbackCount": 3
  },
  "standardOutput": 100,
  "recentFeedbacks": [...]
}
```

#### 3. Manual Recalculation (Admin only)

```http
POST /api/worker-efficiency/:userId/calculate
```

**Response:**
```json
{
  "message": "Efficiency recalculated successfully",
  "efficiency": { ... }
}
```

#### 4. Get Worker Batches

```http
GET /api/worker-efficiency/:userId/batches
```

**Query Parameters:**
- `startDate`: Filter start date
- `endDate`: Filter end date
- `status`: Filter by batch status

#### 5. Add Supervisor Feedback

```http
POST /api/worker-efficiency/:userId/feedback
```

**Body:**
```json
{
  "batchId": "...",
  "feedbackTag": "Excellent",
  "comments": "Great work on this batch"
}
```

**Response:**
```json
{
  "message": "Feedback added successfully",
  "feedback": { ... }
}
```

#### 6. Get Worker Feedback

```http
GET /api/worker-efficiency/:userId/feedback
```

**Response:**
```json
{
  "feedbacks": [...],
  "total": 18,
  "tagCounts": {
    "Excellent": 8,
    "Good": 7,
    "Needs Improvement": 2,
    "Late": 1
  }
}
```

#### 7. Export PDF Report

```http
GET /api/worker-efficiency/:userId/report/pdf?month=11&year=2025
```

**Response:** PDF file download

#### 8. Export Excel Report

```http
GET /api/worker-efficiency/:userId/report/excel?month=11&year=2025
```

**Response:** Excel file download (.xlsx)

#### 9. Monthly Summary (All Workers)

```http
GET /api/worker-efficiency/reports/monthly?month=11&year=2025
```

**Response:**
```json
{
  "month": "2025-11-01T00:00:00.000Z",
  "reports": [
    {
      "worker": { ... },
      "efficiency": { ... },
      "batchCount": 12,
      "feedbackCount": 8
    }
  ],
  "total": 50
}
```

---

## Frontend Pages

### 1. Worker Performance Dashboard

**Path:** `/performance/workers`

**Features:**
- Statistics cards (Total Workers, Avg Efficiency, Top Performer, Need Attention)
- Workers table with star ratings and punctuality bars
- Filters: Search, Sort, Rating range, Role
- Pagination

### 2. Worker Details Page

**Path:** `/performance/workers/:id`

**Tabs:**

1. **Overview Tab**
   - Key metrics cards (Output Efficiency, Punctuality, Feedback Score)
   - Batch summary statistics
   - Recent feedback timeline

2. **Batch History Tab**
   - Detailed table of all batches
   - Output efficiency per batch
   - On-time status indicators

3. **Feedback Tab**
   - Timeline of all feedback received
   - Add new feedback button (Supervisor only)
   - Tag filtering

4. **Reports Tab**
   - Month/Year selector
   - Download PDF button
   - Download Excel button
   - Report preview

---

## Setup Instructions

### Backend Setup

1. **Run Database Migration**

```bash
cd umms_backend
npx prisma migrate dev --name add_worker_feedback_model
npx prisma generate
```

2. **Install Dependencies**

```bash
npm install pdfkit exceljs @types/pdfkit
```

3. **Verify Routes Registration**

Check `src/index.ts`:
```typescript
import workerEfficiencyRoutes from "./routes/workerEfficiencyRoutes";
app.use("/api/worker-efficiency", workerEfficiencyRoutes);
```

4. **Start Backend Server**

```bash
npm run dev
```

### Frontend Setup

1. **Navigate to Frontend Directory**

```bash
cd umms_frontend
```

2. **Verify Routes**

Check `src/components/Home.tsx`:
```typescript
<Route path="/performance/workers" element={<WorkerPerformance />} />
<Route path="/performance/workers/:id" element={<WorkerDetails />} />
```

3. **Start Frontend Server**

```bash
npm run dev
```

---

## Usage Workflow

### 1. Set Standard Output for Workers

**Option A: Via Admin Panel (Future Enhancement)**
- Navigate to Staff Management
- Edit worker profile
- Set "Standard Output per Shift"

**Option B: Via Database**
```sql
-- Set standard output to 100 units for a worker
UPDATE worker_efficiency 
SET standard_output_qty_per_shift = 100 
WHERE user_id = 'worker_id';
```

### 2. Assign Workers to Batches

- In Batch Production, assign workers when creating a batch
- Workers are automatically tracked when batch is completed

### 3. Automatic Efficiency Calculation

- When a batch status is updated to "Completed":
  - System automatically calculates efficiency for all workers in that batch
  - Updates `WorkerEfficiency` table
  - Compares actual duration vs standard (12 hours with 10% buffer)

### 4. Add Supervisor Feedback

1. Navigate to `/performance/workers`
2. Click "View Details" on any worker
3. Go to "Feedback" tab
4. Click "Add Feedback"
5. Select:
   - Batch (from completed batches)
   - Feedback Tag (Excellent, Good, Needs Improvement, Late)
   - Optional comments
6. Submit

**Note:** Feedback immediately triggers efficiency recalculation

### 5. View Performance

- **Worker Dashboard:** See all workers, sorted by rating
- **Worker Details:** View individual performance metrics
- **Filters:** By role, rating range, name search

### 6. Export Reports

1. Go to Worker Details page
2. Click "Reports" tab
3. Select month and year
4. Click "Download PDF" or "Download Excel"

**Report Contents:**
- Performance summary with star rating
- Batch history for the month
- All feedback received
- Recommendations based on performance

---

## Permissions

### View Own Performance
- **Roles:** All Workers

### View All Workers
- **Roles:** Admin, Production Manager, Supervisor

### Add Feedback
- **Roles:** Supervisor, Production Manager, Admin

### Export Reports
- **Roles:** Admin, Production Manager

### Recalculate Efficiency (Manual)
- **Roles:** Admin only

---

## Troubleshooting

### Issue: No efficiency data showing

**Solution:**
1. Ensure workers have completed batches
2. Check if standard output is set:
```sql
SELECT user_id, standard_output_qty_per_shift 
FROM worker_efficiency 
WHERE user_id = 'worker_id';
```
3. Manually trigger recalculation via API:
```bash
POST /api/worker-efficiency/:userId/calculate
```

### Issue: Efficiency ratings seem inaccurate

**Solution:**
1. Verify standard output is correctly set
2. Check batch completion times
3. Review feedback tags (positive vs negative)
4. Weights in formula:
   - Output: 40%
   - Punctuality: 40%
   - Feedback: 20%

### Issue: Worker not appearing in list

**Solution:**
1. Worker must have at least 1 completed batch
2. Check if worker has role "Staff" or a `WorkerEfficiency` record
3. Verify user permissions

### Issue: PDF/Excel export failing

**Solution:**
1. Check backend logs for errors
2. Verify month/year parameters
3. Ensure worker has data for selected month
4. Check file permissions in `/uploads` directory

### Issue: Feedback not updating efficiency

**Solution:**
1. Feedback triggers automatic recalculation
2. Check browser console for API errors
3. Verify supervisor has correct permissions
4. Ensure batch is completed and worker was assigned

---

## Best Practices

1. **Set Standard Output Early**: Configure standard output for all workers before batch production begins

2. **Regular Feedback**: Encourage supervisors to provide feedback after each batch for accurate ratings

3. **Monthly Reviews**: Export and review monthly reports for performance trends

4. **Use Filters**: Use rating and role filters to identify high performers and those needing support

5. **Monitor Punctuality**: Track on-time completion rates to identify process bottlenecks

6. **Fair Feedback**: Use a mix of positive and constructive feedback tags

7. **Standard Output Updates**: Review and adjust standard output values quarterly based on production changes

---

## Configuration

### Customize Punctuality Buffer

In `src/services/efficiencyCalculator.ts`:

```typescript
// Change buffer from 10% to custom value
const maxDuration = 12 * 60 * 60 * 1000; // 12 hours
const buffer = 1.1; // 10% buffer (1.0 = no buffer, 1.2 = 20% buffer)
const isOnTime = actualDuration <= (maxDuration * buffer);
```

### Customize Efficiency Weights

In `src/services/efficiencyCalculator.ts`:

```typescript
// Current: 40% output, 40% punctuality, 20% feedback
const overallScore = 
  (outputEfficiency * 0.4) + 
  (punctualityScore * 0.4) + 
  (feedbackScore * 0.2);

// Example: 50% output, 30% punctuality, 20% feedback
const overallScore = 
  (outputEfficiency * 0.5) + 
  (punctualityScore * 0.3) + 
  (feedbackScore * 0.2);
```

### Customize Star Rating Thresholds

In `src/services/efficiencyCalculator.ts`:

```typescript
export function convertToStarRating(score: number): number {
  if (score <= 0) return 1;
  if (score <= 20) return 1;  // Change thresholds here
  if (score <= 40) return 2;
  if (score <= 60) return 3;
  if (score <= 80) return 4;
  return 5;
}
```

---

## Support

For issues or questions:
1. Check this documentation first
2. Review backend logs: `umms_backend/logs/`
3. Check browser console for frontend errors
4. Review API responses in Network tab

---

## Version History

- **v1.0.0** (2025-11-25): Initial implementation
  - Worker efficiency calculation
  - Star rating system
  - PDF and Excel report generation
  - Supervisor feedback system
  - Performance dashboard and details pages

