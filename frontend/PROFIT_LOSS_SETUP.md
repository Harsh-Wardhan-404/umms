# Profit & Loss Module Documentation

## Overview

The Profit & Loss (P&L) module is a comprehensive financial tracking system that allows administrators and production managers to:

- Track monthly fixed expenses (rent, power, salaries)
- Track variable expenses (material wastage)
- Auto-calculate sales revenue from paid invoices
- Compute gross profit and net profit
- Visualize financial trends with charts
- Compare performance across months, quarters, and years
- Generate reports and export data

## Features

### 1. Monthly P&L Entries
- Create entries for each month with detailed expense tracking
- Auto-calculate sales from invoices
- Real-time profit calculations
- Cannot create entries for future months
- One entry per month (enforced by system)

### 2. Dashboard View
- Summary cards showing key metrics (Sales, Expenses, Profit, Margin)
- Year-to-date (YTD) totals
- Best and worst performing months
- Tabular view of last 6 months
- Quick access to edit and delete functions

### 3. Analytics
- Multiple view types: Monthly, Quarterly, Annual
- Interactive charts using Recharts library
- Revenue & Profit trends (Line chart)
- Expenses comparison (Bar chart)
- Profit margin trends (Area chart)
- Key insights and statistics

## Permissions

### Admin
- Full access to all features
- Create new P&L entries
- Edit existing entries
- Delete entries
- View all analytics and reports

### Production Manager
- View dashboard and analytics
- Cannot create, edit, or delete entries

## How to Use

### Creating a New P&L Entry

1. Navigate to **Finance > Profit & Loss**
2. Click **"Add New Entry"** button (Admin only)
3. Select the month (cannot be in the future)
4. Enter **Fixed Expenses**:
   - Rent
   - Power/Electricity
   - Salaries
   - Other (optional)
5. Enter **Variable Expenses**:
   - Material Wastage
   - Other (optional)
6. Click **"Calculate Sales"** to auto-fetch from invoices
   - Or manually enter sales value (not recommended)
7. Review the **Summary Preview** showing:
   - Gross Profit
   - Net Profit
   - Profit Margin %
8. Click **"Create Entry"** to save

### Viewing P&L Details

1. From the dashboard, click the **eye icon** on any entry
2. View detailed breakdown of:
   - Fixed expenses itemized
   - Variable expenses itemized
   - Sales value and invoice count
   - Profit calculations
3. Click **"Edit Entry"** to modify (Admin only)
4. Click **"Close"** to return to dashboard

### Viewing Analytics

1. Click **"View Analytics"** from the dashboard
2. Select view type: **Monthly**, **Quarterly**, or **Annual**
3. Choose number of periods to display (3, 6, or 12)
4. View interactive charts:
   - Revenue & Profit Trends
   - Expenses Comparison
   - Profit Margin Trend
5. Review key insights at the top

### Editing an Entry

1. From the dashboard, click the **edit icon** (Admin only)
2. Modify any fields as needed
3. Click **"Calculate Sales"** to refresh sales data
4. Click **"Update Entry"** to save changes

### Deleting an Entry

1. From the dashboard, click the **delete icon** (Admin only)
2. Confirm deletion in the modal
3. Entry will be permanently removed

## Calculation Formulas

### Fixed Expenses
```
Total Fixed = Rent + Power + Salaries + Other
```

### Variable Expenses
```
Total Variable = Material Wastage + Other
```

### Sales Calculation
The system automatically calculates sales from invoices:
```
Total Sales = Sum of all paid/partial invoices for the selected month
```

### Profit Calculations
```
Gross Profit = Total Sales - Total Variable Expenses
Net Profit = Gross Profit - Total Fixed Expenses
Profit Margin % = (Net Profit / Total Sales) × 100
```

## API Endpoints

### Get All P&L Records
```
GET /api/profit-loss
Query params: page, limit, sortBy, sortOrder, year
```

### Get P&L by Month
```
GET /api/profit-loss/month/:yearMonth
Format: YYYY-MM (e.g., 2024-01)
```

### Get P&L by ID
```
GET /api/profit-loss/:id
```

### Calculate Monthly Sales
```
GET /api/profit-loss/calculate/:yearMonth
Format: YYYY-MM
Returns: { totalSales, invoiceCount }
```

### Get Analytics Summary
```
GET /api/profit-loss/analytics/summary
Returns: Current month profit, growth%, avg margin, best/worst months, YTD totals
```

### Get Comparison Data
```
GET /api/profit-loss/analytics/comparison?type=monthly&periods=6
Types: monthly, quarterly, annual
```

### Create P&L Entry
```
POST /api/profit-loss
Body: {
  month: "2024-01",
  fixedExpenses: { rent, power, salaries, other },
  variableExpenses: { materialWastage, other },
  totalSalesValue: number,
  manualSalesOverride: boolean
}
```

### Update P&L Entry
```
PUT /api/profit-loss/:id
Body: Same as create
```

### Delete P&L Entry
```
DELETE /api/profit-loss/:id
```

## Best Practices

### 1. Monthly Routine
- Create entries at the end of each month
- Wait for all invoices to be paid before finalizing
- Review calculations before saving
- Compare with previous months

### 2. Data Accuracy
- Always use "Calculate Sales" button to auto-fetch sales
- Double-check expense amounts
- Keep "Other" categories minimal
- Document unusual expenses

### 3. Analysis
- Review profit margins monthly
- Identify expense trends
- Compare quarters and years
- Use analytics to make data-driven decisions

### 4. Manual Override
- Avoid manual sales override when possible
- If overriding, add a note explaining why
- Always verify invoice counts match expectations

## Troubleshooting

### "P&L record already exists for this month"
- Each month can only have one entry
- To update, use the Edit function instead
- Or delete the existing entry and create a new one

### "Cannot create P&L entry for future months"
- System prevents creating entries for months that haven't occurred yet
- Wait until the month has passed

### "Failed to calculate sales"
- Check if invoices exist for that month
- Verify invoices are marked as "Paid" or "Partial"
- Check date range matches the selected month

### Sales calculation shows 0 invoices
- No paid/partial invoices exist for that month
- Check invoice dates and payment statuses
- Manually enter sales if needed (with caution)

### Charts not displaying
- Ensure you have multiple months of data
- Try reducing the number of periods
- Check browser console for errors

## Currency Format

All monetary values are displayed in Indian Rupee (₹) format:
- Standard: ₹1,23,456.00
- Charts (abbreviated):
  - ₹1.2K (thousands)
  - ₹1.2L (lakhs)
  - ₹1.2Cr (crores)

## Color Coding

### Dashboard & Charts
- **Green**: Sales/Revenue (positive indicator)
- **Red**: Expenses (cost indicator)
- **Blue**: Gross Profit
- **Purple**: Net Profit
- **Orange**: Current month highlights

### Profit Margin Badges
- **Green**: ≥20% (excellent)
- **Blue**: 10-19% (good)
- **Yellow**: 0-9% (caution)
- **Red**: <0% (loss)

## Navigation

### Main Access Points
1. **Desktop Navbar**: Finance > Profit & Loss
2. **Desktop Navbar**: Finance > Analytics
3. **Dashboard**: "Add New Entry" button
4. **Dashboard**: "View Analytics" button

### Routes
- `/finance/profit-loss` - Dashboard
- `/finance/profit-loss/new` - Create new entry
- `/finance/profit-loss/edit/:id` - Edit existing entry
- `/finance/profit-loss/analytics` - Analytics page

## Data Storage

### Database Model
```prisma
model ProfitLoss {
  id               String   @id @default(cuid())
  month            DateTime @unique
  fixedExpenses    Json     // { rent, power, salaries, other }
  variableExpenses Json     // { materialWastage, other }
  totalSalesValue  Float
  grossProfit      Float
  netProfit        Float
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

### TypeScript Types
```typescript
interface ProfitLoss {
  id: string;
  month: Date | string;
  fixedExpenses: {
    rent: number;
    power: number;
    salaries: number;
    other?: number;
  };
  variableExpenses: {
    materialWastage: number;
    other?: number;
  };
  totalSalesValue: number;
  grossProfit: number;
  netProfit: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}
```

## Support

For issues or questions:
1. Check this documentation first
2. Review the calculation formulas
3. Verify your permissions (Admin vs Production Manager)
4. Check the browser console for error messages
5. Contact system administrator

## Future Enhancements

Potential improvements for future versions:
- PDF/Excel report exports
- Budget vs Actual comparisons
- Expense category breakdown
- Automated email reports
- Multi-year trend analysis
- Profit forecasting
- Cash flow tracking
- Break-even analysis

---

**Version**: 1.0  
**Last Updated**: November 2025  
**Module**: Finance/Profit & Loss

