# Set Standard Output UI - Testing Guide

## Overview

A new UI has been added to the Staff Details page that allows supervisors and managers to set the standard output for workers. This eliminates the need for manual database queries.

---

## What Changed

### Backend
- **New API Endpoint**: `POST /api/worker-efficiency/:userId/set-standard-output`
- **Permissions**: Supervisor, Production Manager, Admin
- **Location**: `src/routes/workerEfficiencyRoutes.ts`

### Frontend
- **New Component**: `SetStandardOutputModal.tsx`
- **Updated Component**: `StaffDetails.tsx` (now includes edit button and modal)
- **Location**: `src/components/pages/OneStaffDetail/`

---

## How to Test

### Step 1: Start Both Servers

**Backend:**
```bash
cd /Users/harshwardhansaindane/projects/umms_backend
npm run dev
```

**Frontend:**
```bash
cd /Users/harshwardhansaindane/projects/umms_frontend
npm run dev
```

### Step 2: Login

1. Login with a user that has **Supervisor**, **Manager**, or **Admin** role
2. Regular staff cannot set standard output (permission restricted)

### Step 3: Navigate to Staff Page

1. Click **"Staff"** in the sidebar
2. You'll see a list of all users

### Step 4: View Worker Details

1. Click on any **Worker** (Staff role user)
2. You'll be taken to the Staff Details page
3. Look for the **"Standard Output"** card (purple background)

### Step 5: Set Standard Output

#### 5.1 Click the Edit Button

- In the top-right corner of the **"Standard Output"** card, you'll see a small **edit icon** (pencil)
- Click on it to open the modal

#### 5.2 Fill in the Modal

The modal shows:
- **Worker name** at the top
- **Info box** explaining what standard output means
- **Input field** for entering the value (in units)
- **Current value** displayed below the input
- **Examples** to guide you

**Enter a value:**
- Example: `100` (for 100 units per shift)
- Must be a positive number
- Can include decimals (e.g., `125.5`)

#### 5.3 Save

1. Click **"Save & Recalculate"**
2. The modal will:
   - Save the new standard output
   - Automatically trigger efficiency recalculation
   - Close and refresh the page

**Expected Result:**
- The **"Standard Output"** card now shows your new value
- If the worker has completed batches, their efficiency rating will be recalculated

---

## Visual Guide

### Before Setting Standard Output

```
┌─────────────────────────────┐
│  Standard Output         ✏️  │
│                             │
│         N/A                 │
│                             │
└─────────────────────────────┘
```

### After Setting Standard Output

```
┌─────────────────────────────┐
│  Standard Output         ✏️  │
│                             │
│         100                 │
│                             │
└─────────────────────────────┘
```

### Modal View

```
╔═══════════════════════════════════════╗
║  Set Standard Output              ✕   ║
║  For: John Doe                        ║
╟───────────────────────────────────────╢
║                                       ║
║  ℹ️ What is Standard Output?          ║
║  Standard Output is the expected      ║
║  production quantity per shift...     ║
║                                       ║
║  Standard Output per Shift *          ║
║  ┌─────────────────────────┐          ║
║  │ 100                units│          ║
║  └─────────────────────────┘          ║
║  Current: Not set                     ║
║                                       ║
║  Examples:                            ║
║  • Production worker: 100 units       ║
║  • Packaging worker: 150 units        ║
║                                       ║
║  [ Cancel ]  [ Save & Recalculate ]   ║
╚═══════════════════════════════════════╝
```

---

## Testing Scenarios

### Scenario 1: New Worker (No Standard Output)

**Initial State:**
- Standard Output card shows: `N/A`
- Efficiency Rating: `N/A` or `0`

**Steps:**
1. Click edit icon
2. Enter `100` in the modal
3. Click "Save & Recalculate"

**Expected:**
- Standard Output card shows: `100`
- If worker has completed batches, efficiency recalculates

### Scenario 2: Update Existing Standard Output

**Initial State:**
- Standard Output: `80`
- Efficiency Rating: `3.5` stars

**Steps:**
1. Click edit icon
2. Change value to `120`
3. Click "Save & Recalculate"

**Expected:**
- Standard Output updates to `120`
- Efficiency rating recalculates (may go up or down based on actual output)

### Scenario 3: Invalid Input

**Steps:**
1. Click edit icon
2. Enter `-50` (negative number)
3. Click "Save & Recalculate"

**Expected:**
- Error message: "Please enter a valid positive number"
- Value not saved

### Scenario 4: Empty Input

**Steps:**
1. Click edit icon
2. Leave field empty
3. Try to submit

**Expected:**
- HTML5 validation prevents submission
- Button may be disabled

### Scenario 5: Permission Check

**As Regular Staff:**
1. Login as a regular staff member (not supervisor/manager)
2. Try to access another worker's details

**Expected:**
- Either can't access the page, or edit button is hidden
- If they somehow trigger the API, it should return 403 Forbidden

---

## API Testing (Optional)

### Using Postman or curl

**Request:**
```http
POST http://localhost:3000/api/worker-efficiency/{userId}/set-standard-output
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json

Body:
{
  "standardOutputQtyPerShift": 100
}
```

**Success Response (200):**
```json
{
  "message": "Standard output set successfully",
  "workerEfficiency": {
    "id": "...",
    "userId": "...",
    "standardOutputQtyPerShift": 100,
    "punctualityScore": 0,
    "efficiencyRating": 0,
    ...
  }
}
```

**Error Responses:**

**400 - Invalid Input:**
```json
{
  "error": "Valid standard output is required"
}
```

**403 - Permission Denied:**
```json
{
  "error": "Permission denied"
}
```

**404 - Worker Not Found:**
```json
{
  "error": "Worker not found"
}
```

---

## Database Verification

After setting standard output, verify in database:

```sql
SELECT 
  we.user_id,
  u.first_name,
  u.last_name,
  we.standard_output_qty_per_shift,
  we.efficiency_rating,
  we.last_calculated
FROM worker_efficiency we
JOIN users u ON we.user_id = u.id
WHERE u.role = 'Staff';
```

**Expected Result:**
- The worker's record should show the new standard output value
- `last_calculated` should be updated to current timestamp

---

## Common Issues & Solutions

### Issue 1: Modal doesn't open

**Solution:**
- Check browser console for errors
- Verify import of `SetStandardOutputModal` in `StaffDetails.tsx`
- Ensure React state is properly managed

### Issue 2: "Permission denied" error

**Solution:**
- Ensure you're logged in as Supervisor/Manager/Admin
- Check JWT token is valid
- Verify backend `requireSupervisor` middleware

### Issue 3: Value saves but efficiency doesn't recalculate

**Solution:**
- The modal calls `/calculate` endpoint after setting standard output
- Check backend logs for calculation errors
- Ensure worker has completed batches (can't calculate without data)

### Issue 4: Page doesn't refresh after save

**Solution:**
- The modal uses `window.location.reload()` on success
- This is intentional to fetch fresh data
- If it doesn't work, check `onSuccess` callback

### Issue 5: Edit button not visible

**Solution:**
- Button only shows for workers (role: "Worker" or "Staff")
- Check the conditional rendering:
  ```tsx
  {data.role === "Worker" && (
    // Standard Output card with edit button
  )}
  ```

---

## Integration with Efficiency System

### How It Affects Calculations

**Output Efficiency Formula:**
```
outputEfficiency = (actualOutput / standardOutput) × 100
```

**Example:**
- Standard Output: 100 units
- Actual Output: 85 units
- Output Efficiency: (85/100) × 100 = **85%**

**Overall Rating (Weighted):**
```
overallScore = (outputEfficiency × 0.4) + (punctualityScore × 0.4) + (feedbackScore × 0.2)
```

**Impact:**
- Setting a **lower** standard output → **higher** efficiency score
- Setting a **higher** standard output → **lower** efficiency score
- Be fair and realistic with values!

---

## Best Practices

1. **Set Based on Role:**
   - Production workers: 80-120 units
   - Packaging workers: 100-150 units
   - Quality control: 60-100 units

2. **Review Quarterly:**
   - Standards may change as processes improve
   - Update as needed

3. **Be Consistent:**
   - Similar roles should have similar standards
   - Document your reasoning

4. **Monitor Impact:**
   - After changing, check how it affects ratings
   - Adjust if needed

5. **Communication:**
   - Inform workers of their standard output
   - Explain how it's measured

---

## Future Enhancements

Potential improvements:
- Bulk set standard output for multiple workers
- Historical tracking of standard output changes
- Suggested values based on historical performance
- Export standard output report
- Role-based default values

---

## Quick Reference

| Item | Details |
|------|---------|
| **Feature** | Set Standard Output UI |
| **Location** | Staff Details Page → Standard Output Card |
| **Permissions** | Supervisor, Production Manager, Admin |
| **API Endpoint** | `POST /api/worker-efficiency/:userId/set-standard-output` |
| **Auto-Recalculates** | Yes, after saving |
| **Required Field** | Standard Output (must be > 0) |
| **Units** | Production units per shift |

---

## Support

If you encounter issues:
1. Check browser console (F12)
2. Check backend logs
3. Verify permissions
4. Review `WORKER_EFFICIENCY_SETUP.md` for general troubleshooting

---

**Version:** 1.0  
**Last Updated:** 2025-11-25  
**Author:** UMMS Development Team

