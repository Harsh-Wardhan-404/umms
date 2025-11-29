# Batch Production - Quick Start Guide

## 🚀 Getting Started in 3 Steps

### Step 1: Prerequisites
✓ Backend server running on `http://localhost:3000`  
✓ At least one locked formulation version  
✓ Sufficient raw materials in stock  
✓ User authenticated with role: Admin, Manager, or Supervisor

### Step 2: Create Your First Batch

1. **Navigate**: Production → Batch Production → **Create Batch**

2. **Select Product** (Step 1/3):
   - Choose a formulation
   - Select a locked version
   - Enter batch size (e.g., 100 units)
   - ✓ System auto-calculates material requirements
   - ✓ Check all materials are available (green checkmarks)
   - Click **Next: Workers & Shift**

3. **Assign Team** (Step 2/3):
   - Select workers from the list (click to toggle)
   - Choose shift: Morning/Evening/Night
   - Set start time
   - Add optional notes
   - Click **Next: Review & Confirm**

4. **Confirm & Create** (Step 3/3):
   - Review all details
   - Click **Confirm & Create Batch**
   - ✓ Materials automatically deducted from inventory
   - ✓ QR code generated
   - ✓ Batch created successfully!

### Step 3: Manage Your Batch

From the batch details page, you can:

- **📸 Upload Photos**: Before/after packaging, quality checks
- **✅ Add Quality Checks**: Record inspections with pass/fail results
- **🔄 Update Status**: Move through production stages
- **📱 View QR Code**: Print or download for labeling
- **📊 Generate Report**: Comprehensive production analysis

## 🎯 Quick Actions

### View All Batches
```
Production → Batch Production
```
- Search by batch code or product name
- Filter by status, shift, date
- Click batch code to view details

### Track Batch Status
Status workflow:
```
Planned → InProgress → QualityCheck → Completed
```
Can also mark as `Cancelled` if needed

### Upload Photos
1. Open batch details
2. Click **Upload Photos**
3. Choose method:
   - **File Upload**: Select images from device
   - **Camera Capture**: Take photos directly
4. Select photo type
5. Click **Upload**

### Add Quality Check
1. Open batch details
2. Click **Add Quality Check**
3. Select check type (or enter custom)
4. Mark **Pass** or **Fail**
5. Add detailed notes
6. Click **Add Quality Check**

### Print QR Code
1. Open batch details
2. Click **View QR** button
3. In QR modal:
   - Click **Print QR Code** (opens print dialog)
   - Or **Download PNG** (saves to device)

## 📋 Common Tasks

### Check Material Availability
```
Inventory → Raw Materials
- View current stock levels
- Add materials if needed
```

### Lock a Formulation
```
Production → Formulations & R&D
- Select formulation
- View version details
- Click **Lock for Production**
```

### View Production Report
```
Batch Details → Click "View Report"
- Material usage breakdown
- Quality check summary
- Production timeline
- Worker assignments
```

## 🔧 Troubleshooting

### "No locked formulation versions available"
→ Go to Formulations, select formulation, lock a version

### "Insufficient materials in stock"
→ Go to Inventory → Raw Materials, add stock

### Photo upload fails
→ Check file size (<10MB) and format (JPG/PNG/WebP)

### Camera not working
→ Grant camera permissions in browser settings

## 💡 Pro Tips

1. **Use QR Codes**: Print and attach to packaging for instant batch lookup
2. **Add Photos Early**: Document before/after packaging for quality records
3. **Regular Quality Checks**: Add checks at each production stage
4. **Notes Are Important**: Detailed notes help with future troubleshooting
5. **Status Updates**: Keep batch status current for accurate tracking

## 📱 Mobile Usage

While the system is web-based, you can use it on mobile devices:
- Camera capture works on mobile browsers
- QR scanning works with mobile camera
- Touch-friendly interface
- Responsive design adapts to screen size

## 🎓 Best Practices

1. **Plan Ahead**: Check material availability before creating batches
2. **Document Everything**: Use photos and notes extensively
3. **Quality First**: Add quality checks at multiple stages
4. **Real-time Updates**: Update batch status as production progresses
5. **Review Reports**: Use reports to identify improvement opportunities

## 📊 Key Metrics Tracked

- Production duration (start to end time)
- Material usage vs. planned
- Quality pass rate
- Worker assignments
- Batch completion rate

## 🔐 Security & Permissions

- Only managers and supervisors can create batches
- All actions are logged with user ID
- Quality checks record inspector information
- Material deductions are transaction-safe

## 📞 Need Help?

1. Check the full documentation: `BATCH_PRODUCTION_SETUP.md`
2. Review backend API docs: `BATCH_API.md`
3. Check browser console for errors
4. Verify backend server is running

## ✨ Quick Reference

| Action | Location | Access |
|--------|----------|--------|
| Create Batch | Batch Production → Create | Manager+ |
| View Batches | Batch Production | All |
| Upload Photos | Batch Details → Upload Photos | All |
| Add Quality Check | Batch Details → Add Quality Check | All |
| Update Status | Batch Details → Update Status | Supervisor+ |
| View Report | Batch Details → View Report | All |
| Print QR Code | Batch Details → View QR | All |

---

**Ready to create your first batch? Let's go! 🚀**

Navigate to: **Production → Batch Production → Create Batch**

