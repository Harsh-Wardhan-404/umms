# Staff Details Page - Testing Guide

## Quick Test Checklist

### ✅ Test 1: Page Loads Without Errors

1. **Start both servers** (if not already running)
2. **Login** as Admin
3. **Navigate to Staff page** (`/staff`)
4. **Click on any worker** from the list
5. **Expected Result**: 
   - ✅ Page loads without any console errors
   - ✅ No "Cannot read properties of undefined (reading 'iconColor')" error
   - ✅ Shows real user data (name, role, joining date, ID)

### ✅ Test 2: All Roles Display Correctly

Test with users of different roles:

| Role | Icon | Background Color | Expected Description |
|------|------|-----------------|---------------------|
| **Admin** | CircleDollarSign | Blue | "Administrators have full access..." |
| **Staff** | Award | Yellow | "Staff members are responsible..." |
| **ProductionManager** | ShoppingCart | Green | "Production Managers oversee..." |
| **InventoryManager** | Box | Purple | "Inventory Managers are responsible..." |
| **Supervisor** | Search | Red | "Supervisors oversee the work..." |
| **Sales** | ShoppingCart | Indigo | "Sales representatives manage..." |
| **Dispatch** | Box | Orange | "Dispatch coordinators manage..." |

**Test Steps:**
1. Create test users with each role (if not exists)
2. Navigate to each user's details page
3. Verify icon, background color, and description match

### ✅ Test 3: Worker Efficiency Data

For **Staff/Worker roles only**:

1. Navigate to a Staff member's details page
2. Check the metrics cards:
   - **Punctuality Score**: Should show number or "N/A"
   - **Efficiency Rating**: Should show number or "N/A"
   - **Standard Output**: Should show number or "N/A"

3. **If worker efficiency exists**:
   - ✅ All three values display as numbers
   - ✅ Edit button (pencil icon) appears on Standard Output card
   
4. **If worker efficiency doesn't exist**:
   - ✅ All three values show "N/A"
   - ✅ Edit button still appears (to create initial value)

### ✅ Test 4: Set Standard Output Feature

1. Navigate to any Staff/Worker details page
2. Click the **pencil icon** on "Standard Output" card
3. **Expected**: Modal opens (no errors)
4. Enter a value (e.g., `100`)
5. Click "Save & Recalculate"
6. **Expected**: 
   - ✅ Success toast appears
   - ✅ Modal closes
   - ✅ Page data refreshes smoothly (no full reload)
   - ✅ Standard Output card shows new value

### ✅ Test 5: Role-Specific Sections

**For Supervisor:**
- Should see "Supervised Batches" section
- Shows count of batches

**For ProductionManager:**
- Should see "Created Formulations" section
- Shows count of formulations

**For other roles:**
- These sections should not appear

### ✅ Test 6: Error Handling

**Test 6.1: Invalid User ID**
1. Manually navigate to `/staff/invalid-id-12345`
2. **Expected**:
   - ✅ Shows error message: "Staff member not found" or actual error
   - ✅ Shows "Go Back" button
   - ✅ Clicking "Go Back" returns to previous page

**Test 6.2: Network Error**
1. Stop backend server
2. Try to navigate to staff details page
3. **Expected**:
   - ✅ Shows loading state first
   - ✅ Then shows error message
   - ✅ No console crashes

---

## Common Issues & Solutions

### Issue 1: "iconColor" Error Still Appears
**Cause**: Old cached version of the file  
**Solution**: 
```bash
# Clear cache and restart
cd /Users/harshwardhansaindane/projects/umms_frontend
rm -rf node_modules/.vite
npm run dev
```

### Issue 2: "Worker not found" Error
**Cause**: Trying to access user that doesn't exist  
**Solution**: 
- Make sure you're clicking on a real user from the Staff list
- Don't manually type user IDs in the URL

### Issue 3: Role Icon Missing
**Cause**: Role not in userData object  
**Solution**: 
- Already fixed - all roles are now included
- If adding new roles, add them to userData object in StaffDetails.tsx

---

## Success Criteria

All tests above should pass with:
- ✅ No console errors
- ✅ No TypeScript errors
- ✅ Smooth user experience
- ✅ Real data displayed correctly
- ✅ Set Standard Output works perfectly

---

## Version
- **Last Updated**: 2025-11-25
- **Issues Fixed**: 
  1. Mock data replaced with real API calls
  2. Role mapping errors fixed
  3. Missing role definitions added
  4. Proper fallbacks implemented

