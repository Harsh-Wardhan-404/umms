# Finished Goods Inventory & Sales Billing - Setup & Usage Guide

## Overview

The Sales & Billing module provides comprehensive management of finished goods inventory, client relationships, and GST-compliant invoicing. This module integrates seamlessly with the Batch Manufacturing System to track post-production inventory and generate professional invoices.

## Features Implemented

### 1. Finished Goods Management
- **List Page** (`/sales/finished-goods`)
  - View all finished goods with batch linkage
  - Filter by quality status (Approved, Pending, Rejected)
  - Search by product name or batch code
  - View available quantity and unit price
  - Stock status indicators (out of stock warnings)
  - Real-time statistics dashboard

- **Create/Update Form**
  - Link to completed batch
  - Set quantity produced and available
  - Define unit price and HSN code
  - Quality status selection
  - Automatic product name from batch

### 2. Client Management
- **List Page** (`/sales/clients`)
  - View all active/inactive clients
  - Search by name, email, or contact person
  - Status management (active/inactive)
  - Quick access to client details

- **Client Form with Validation**
  - GST Number validation (15-character format)
  - PAN Number validation (10-character format)
  - Email and phone validation
  - Real-time field validation with error messages
  - Credit limit and payment terms
  - Complete billing address

### 3. Invoicing System
- **Invoice List** (`/sales/invoices`)
  - View all invoices with filters
  - Filter by payment status, date range
  - Search by invoice number or client name
  - Financial summary (total, pending, paid amounts)
  - Quick access to view and print

- **Create Invoice** (`/sales/invoices/create`)
  - Select client with auto-fill details
  - Add multiple products from finished goods
  - Real-time stock availability check
  - Automatic GST calculation
  - Edit quantities and prices
  - Invoice date and due date selection
  - Notes and terms

- **Invoice Details** (`/sales/invoices/:id`)
  - Complete invoice information
  - Client and billing details
  - Itemized product list with HSN codes
  - Tax breakdown (CGST/SGST or IGST)
  - Payment status tracking
  - Print access

- **Print-Ready Invoice** (`/sales/invoices/:id/print`)
  - Professional Indian invoice format
  - Company and client details
  - Itemized product table with HSN codes
  - GST breakdown (intrastate/interstate)
  - Amount in words (Indian numbering)
  - Terms & conditions
  - Bank details
  - Authorized signatory section
  - Print-optimized CSS

## GST Calculation Logic

### Automatic Tax Calculation

The system automatically determines tax applicability based on client and company GST numbers:

#### Intrastate Transaction (Same State)
- **Condition**: First 2 digits of GST numbers match
- **Tax**: CGST + SGST
- **Rate**: 9% + 9% = 18% total (default)
- **Example**: Maharashtra (27) to Maharashtra (27)

#### Interstate Transaction (Different States)
- **Condition**: First 2 digits of GST numbers differ
- **Tax**: IGST
- **Rate**: 18% total (default)
- **Example**: Maharashtra (27) to Karnataka (29)

### HSN-Based Tax Rates

The system supports HSN code-based tax rates:

| HSN Code | Category | GST Rate |
|----------|----------|----------|
| 3003 | Medicaments | 12% |
| 3004 | Medicaments (measured doses) | 12% |
| 3301 | Essential oils | 18% |
| 3303 | Perfumes | 18% |
| 3304 | Beauty/makeup preparations | 18% |
| 3305 | Hair preparations | 18% |
| 3306 | Oral hygiene | 18% |
| 3307 | Shaving preparations | 18% |
| Default | Other products | 18% |

### Amount in Words Conversion

The system converts invoice amounts to Indian number words:
- Example: ₹8,850.00 → "Eight Thousand Eight Hundred Fifty Rupees Only"
- Supports: Ones, Tens, Hundreds, Thousands, Lakhs, Crores
- Includes paise (decimal amounts)

## Validation Rules

### GST Number Format
```
Pattern: ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$
Length: 15 characters
Example: 27AAAAA0000A1Z5

Structure:
- First 2 digits: State code (01-37)
- Next 5 characters: PAN of business entity
- Next 4 digits: Entity number
- Next 1 character: Entity code
- Next 1 character: Z (default)
- Last 1 character: Check code
```

### PAN Number Format
```
Pattern: ^[A-Z]{5}[0-9]{4}[A-Z]{1}$
Length: 10 characters
Example: AAAAA0000A

Structure:
- First 5 characters: Alphabets
- Next 4 characters: Numbers
- Last 1 character: Alphabet
```

### Invoice Validation
- ✓ At least one client must be selected
- ✓ At least one product must be added
- ✓ Quantity cannot exceed available stock
- ✓ Invoice date cannot be in future
- ✓ Due date must be after invoice date
- ✓ Quantities and prices must be positive numbers

### Email & Phone Validation
- ✓ Email: Standard email format with @ and domain
- ✓ Phone: Minimum 10 digits, allows +, -, (, ), spaces

## Usage Guide

### Creating a Client

1. Navigate to **Sales & Billing → Clients**
2. Click **Add New Client** button
3. Fill in required information:
   - Client Name (required)
   - Email, Phone, Address
   - GST Number (validates format automatically)
   - PAN Number (validates format automatically)
   - Contact Person
   - Credit Limit and Payment Terms
4. System validates GST/PAN in real-time
5. Click **Add Client**

### Adding Finished Goods

1. Navigate to **Sales & Billing → Finished Goods**
2. Click **Add Finished Good**
3. Select a completed batch from dropdown
   - Only batches without finished goods shown
   - Product name auto-fills from batch
4. Enter:
   - Quantity Produced
   - Available Quantity (≤ Produced)
   - Unit Price
   - HSN Code (for GST)
   - Quality Status
5. Click **Add Finished Good**

### Creating an Invoice

1. Navigate to **Sales & Billing → Invoices**
2. Click **Create Invoice**
3. **Step 1**: Select Client
   - Choose from active clients
   - Client details displayed automatically
4. **Step 2**: Add Products
   - Select products from dropdown
   - Only approved, available items shown
   - Adjust quantity and price if needed
   - System checks stock availability
5. **Step 3**: Review Tax Calculation
   - System automatically calculates GST
   - Shows CGST+SGST (intrastate) or IGST (interstate)
   - Displays total in numbers and words
6. Set invoice date and due date
7. Add optional notes
8. Click **Create Invoice**

### Printing an Invoice

1. Open invoice from list
2. Click **Print** button
3. System opens print-ready template
4. Review invoice format
5. Click **Print Invoice** or use browser print (Ctrl+P)

### Managing Payment Status

1. Open invoice details
2. Current status displayed with badge
3. Click status to update
4. Select new status: Pending, Partial, Paid
5. Add payment notes
6. Save changes

## API Integration

### Finished Goods Endpoints
- `GET /api/finished-goods` - List all finished goods
- `POST /api/finished-goods` - Create finished good
- `GET /api/finished-goods/:id` - Get details
- `PATCH /api/finished-goods/:id` - Update
- `DELETE /api/finished-goods/:id` - Delete

### Client Endpoints
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create client
- `GET /api/clients/:id` - Get details
- `PATCH /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Deactivate client

### Invoice Endpoints
- `GET /api/invoices` - List all invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get details
- `PATCH /api/invoices/:id/payment-status` - Update payment
- `DELETE /api/invoices/:id` - Delete invoice

## File Structure

```
src/
├── components/
│   ├── pages/
│   │   ├── FinishedGoods/
│   │   │   └── FinishedGoods.tsx
│   │   ├── Clients/
│   │   │   └── Clients.tsx
│   │   └── Invoices/
│   │       ├── Invoices.tsx
│   │       ├── CreateInvoiceWizard.tsx
│   │       ├── InvoiceDetails.tsx
│   │       └── InvoicePrint.tsx
│   └── Forms/
│       ├── FinishedGoodForm.tsx
│       └── ClientForm.tsx
└── lib/
    └── gstCalculator.ts
```

## Troubleshooting

### Issue: "Invalid GST format"
**Solution**: Ensure GST number is exactly 15 characters and follows format: `27AAAAA0000A1Z5`
- First 2 digits must be valid state code (01-37)
- Use uppercase letters only

### Issue: "Insufficient stock for product"
**Solution**: Check available quantity in Finished Goods. The requested quantity exceeds available stock.
- Update finished goods quantity
- Or reduce invoice quantity

### Issue: "No completed batches available"
**Solution**: Complete a batch first in Batch Production before creating finished goods.
- Navigate to Batch Production
- Mark batch as "Completed"
- Then create finished good

### Issue: Tax calculation seems incorrect
**Solution**: Verify GST numbers are correct
- Check client GST number (state code)
- Company GST defaults to Maharashtra (27)
- Intrastate: CGST 9% + SGST 9%
- Interstate: IGST 18%

### Issue: Invoice not printing correctly
**Solution**: Use print-specific page
- Click "Print" button from invoice details
- Opens print-optimized template
- Use browser print (not page print)

## Indian Invoice Format Compliance

The invoice template complies with Indian GST requirements:

✓ Company GSTIN displayed  
✓ Client GSTIN displayed  
✓ Invoice number and date  
✓ Itemized product list  
✓ HSN codes for each item  
✓ Tax breakdown (CGST/SGST or IGST)  
✓ Total amount in numbers and words  
✓ Bank details for payment  
✓ Terms & conditions  
✓ Authorized signatory section  
✓ "ORIGINAL FOR RECIPIENT" watermark  

## Future Enhancements

- PDF generation and download
- Email invoice to client
- Payment reminder notifications
- Recurring invoices
- Credit note generation
- Dispatch integration
- Client portal access
- Multi-currency support
- Advanced reporting & analytics

## Support

For issues or questions:
1. Check validation error messages
2. Verify GST/PAN formats
3. Ensure stock availability
4. Check console logs for API errors
5. Review backend API documentation

---

**Last Updated**: November 24, 2024  
**Module**: Sales & Billing  
**Version**: 1.0.0

