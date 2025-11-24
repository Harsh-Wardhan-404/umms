# Finished Goods Inventory & Sales Billing - Implementation Plan

## Overview

Implement comprehensive sales and billing module with GST-compliant invoicing, client management, and finished goods tracking.

## Components to Implement

### 1. Finished Goods Management ✓
- [x] List page with filters (FinishedGoods.tsx)
- [x] Create/Update form (FinishedGoodForm.tsx)
- [ ] Details page
- [ ] Update FormModal integration

### 2. Client Management
- [ ] Client list page (Clients.tsx)
- [ ] Client form with GST/PAN validation (ClientForm.tsx)
- [ ] Client details page
- [ ] FormModal integration

### 3. Invoicing System
- [ ] Invoice list page (Invoices.tsx)
- [ ] Invoice creation wizard (CreateInvoiceWizard.tsx)
  - Step 1: Client selection
  - Step 2: Product selection with quantities
  - Step 3: Review with GST calculations
- [ ] Invoice details/preview page (InvoiceDetails.tsx)
- [ ] Print-ready Indian invoice template (InvoicePrint.tsx)
- [ ] GST calculation utility (gstCalculator.ts)

### 4. Routes & Navigation
- [ ] Update Home.tsx with new routes
- [ ] Add to FormModal
- [ ] Update sidebar navigation

## Key Features

### GST Calculation Logic

```typescript
// Intrastate (same state): CGST + SGST
// Interstate (different state): IGST
// HSN-based tax rates

interface TaxCalculation {
  subtotal: number;
  cgst: number;      // 9% for intrastate
  sgst: number;      // 9% for intrastate
  igst: number;      // 18% for interstate
  totalTax: number;
  totalAmount: number;
  gstRate: number;   // 18% default
}

function calculateGST(
  subtotal: number,
  clientGST: string,  // Client GST number
  companyGST: string, // Company GST number
  hsnCode: string
): TaxCalculation
```

### Indian Invoice Format

- Company details at top
- Invoice number, date, due date
- Client billing & shipping address
- GST numbers (company & client)
- Item table with HSN codes
- Tax breakdown (CGST/SGST or IGST)
- Total in words
- Bank details
- Terms & conditions
- Authorized signatory

## Implementation Priority

1. **High Priority** (Core functionality):
   - Finished Goods list & form ✓
   - Client management (list, form)
   - Invoice creation wizard
   - GST calculation
   - Basic invoice view

2. **Medium Priority** (Enhanced UX):
   - Print-ready invoice template
   - Invoice PDF generation
   - Client details page
   - Finished goods details

3. **Low Priority** (Nice to have):
   - Invoice statistics
   - Payment tracking
   - Dispatch integration
   - Advanced filters

## Quick Implementation Guide

Since this is a large module, I'll implement the **minimum viable product (MVP)** first:

### MVP Components (Priority Order):

1. ✅ Finished Goods list
2. ✅ Finished Goods form
3. **Clients list** - Simple CRUD
4. **Client form** - With GST validation
5. **Invoices list** - With filters
6. **Create Invoice** - Simplified single-page form
7. **Invoice view** - With print template
8. **GST utility** - Calculation logic

Let me know if you want:
- **A) Full implementation** - All components with advanced features (~30+ files)
- **B) MVP implementation** - Core functionality only (~8-10 files, faster)
- **C) Specific component** - Tell me which one to focus on first

The backend API is already complete, so frontend implementation is straightforward!

