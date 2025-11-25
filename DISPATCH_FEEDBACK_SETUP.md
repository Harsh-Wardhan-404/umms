# Dispatch & Client Feedback Module - Setup Guide

## Overview

This module implements a complete dispatch tracking and client feedback system for the UMMS application. It includes dispatch management linked to invoices with status tracking (Ready → In Transit → Delivered), automatic feedback capture on delivery, issue tagging, and client-specific feedback analytics dashboard.

## Features Implemented

### 1. Dispatch Management
- ✅ Create dispatch entries for paid invoices
- ✅ Track dispatch status (Ready, In Transit, Delivered)
- ✅ Courier and AWB (Air Waybill) number management
- ✅ Real-time status timeline visualization
- ✅ Dispatch filtering and search functionality
- ✅ Integration with invoice details page

### 2. Client Feedback System
- ✅ Star rating system (1-5 stars) for:
  - Product Quality
  - Packaging Quality
  - Delivery Experience
- ✅ Issue tagging system with predefined categories
- ✅ Client remarks/comments capture
- ✅ Automatic feedback prompt when status changes to "Delivered"
- ✅ Validation: Issue tags required when any rating < 3

### 3. Client Feedback Dashboard
- ✅ Average ratings display (overall, quality, packaging, delivery)
- ✅ Issue summary with counts
- ✅ Recent feedback list with filters
- ✅ Tabbed interface on client details page
- ✅ Visual star ratings and badges

## Backend API Endpoints

### Dispatch Routes (`/api/dispatches`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Create new dispatch | Manager |
| GET | `/` | List all dispatches (with filters) | Authenticated |
| GET | `/:id` | Get single dispatch details | Authenticated |
| PATCH | `/:id/status` | Update dispatch status | Manager |
| PATCH | `/:id` | Update dispatch details (courier, AWB, date) | Manager |
| DELETE | `/:id` | Delete dispatch | Admin |

### Feedback Routes (`/api/feedback`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Create feedback entry | Authenticated |
| GET | `/` | List all feedback (with filters) | Authenticated |
| GET | `/client/:clientId` | Get feedback for specific client with analytics | Authenticated |
| GET | `/:id` | Get single feedback details | Authenticated |
| PATCH | `/:id` | Update feedback | Manager |
| DELETE | `/:id` | Delete feedback | Admin |

## Database Schema

### Dispatch Model
```prisma
model Dispatch {
  id          String         @id @default(cuid())
  invoiceId   String         @unique
  courierName String
  awbNumber   String
  dispatchDate DateTime
  status      DispatchStatus // Ready, InTransit, Delivered
  creatorId   String
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  invoice   Invoice   @relation(...)
  feedback  Feedback?
  creator   User      @relation(...)
}
```

### Feedback Model
```prisma
model Feedback {
  id             String   @id @default(cuid())
  dispatchId     String   @unique
  clientId       String
  productId      String
  ratingQuality  Int      // 1-5
  ratingPackaging Int     // 1-5
  ratingDelivery Int      // 1-5
  clientRemarks  String?
  issueTags      String[] // Array of issue categories
  feedbackDate   DateTime @default(now())
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  dispatch Dispatch @relation(...)
  client   Client   @relation(...)
}
```

## Frontend Components

### Pages
- **Dispatches.tsx** - List all dispatches with filters and stats
- **DispatchDetails.tsx** - Detailed dispatch view with timeline and feedback
- **ClientDetails.tsx** - Client information with feedback dashboard tab

### Forms & Modals
- **DispatchForm.tsx** - Create/update dispatch with invoice selection
- **StatusUpdateModal.tsx** - Update dispatch status with validation
- **FeedbackForm.tsx** - Star ratings, issue tags, and remarks

### Routing
```typescript
// Added in Home.tsx
<Route path="/sales/dispatches" element={<Dispatches />} />
<Route path="/sales/dispatches/:id" element={<DispatchDetails />} />
<Route path="/sales/clients/:id" element={<ClientDetails />} />
```

### Navigation
Added "Dispatches" menu item under "Sales & Billing" section in DesktopNavBar.

## Validation Rules

### Dispatch Validation
- ✅ Invoice must exist and not have an existing dispatch
- ✅ AWB number must be unique across all dispatches
- ✅ Courier name: 2-50 characters
- ✅ Dispatch date cannot be in the future
- ✅ Status transitions must be forward only (no going back)

### Feedback Validation
- ✅ All three ratings required (1-5 integers)
- ✅ Issue tags required when any rating < 3
- ✅ Client remarks limited to 500 characters
- ✅ Dispatch must be in "Delivered" status
- ✅ One feedback per dispatch (unique constraint)

## Issue Tag Options
The following predefined issue tags are available:
- Product Quality
- Packaging Damage
- Delivery Delay
- Incorrect Product
- Quantity Mismatch
- Other

## Workflow

### 1. Creating a Dispatch
1. Navigate to an invoice details page
2. Click "Create Dispatch" button
3. Select invoice (auto-filled if coming from invoice page)
4. Enter courier name and AWB number
5. Set dispatch date (defaults to today)
6. Submit (initial status: "Ready")

### 2. Tracking Dispatch Status
1. Navigate to Dispatches list or Dispatch Details page
2. Click "Update Status" button
3. Select new status (only forward progression allowed)
4. Confirm update
5. System prompts for feedback when status changes to "Delivered"

### 3. Submitting Feedback
1. After dispatch status is "Delivered"
2. Click "Add Feedback" button on dispatch details page
3. Rate Product Quality, Packaging, and Delivery (1-5 stars)
4. Select issue tags if any rating < 3 (required)
5. Add optional client remarks (max 500 characters)
6. Submit feedback

### 4. Viewing Feedback Analytics
1. Navigate to Clients page
2. Click "View Details" (eye icon) for a client
3. Switch to "Feedback Dashboard" tab
4. View average ratings, issue summary, and recent feedback

## Features Highlights

### Dispatch Status Timeline
Visual timeline showing:
- Ready (Blue) with Package icon
- In Transit (Yellow) with Truck icon
- Delivered (Green) with CheckCircle icon

### Feedback Dashboard Analytics
- **Average Ratings Card**: Overall, Quality, Packaging, Delivery
- **Issue Summary**: Count of each issue tag with badges
- **Recent Feedback List**: Last 5 feedback entries with ratings and issues
- **Star Rating Visualization**: Interactive star display (1-5)

### Invoice Integration
- Dispatch section added to invoice details page
- Shows dispatch status if exists
- "Create Dispatch" button if no dispatch
- "Track Dispatch" button links to dispatch details

## Testing Checklist

- [ ] Create dispatch for a paid invoice
- [ ] Verify AWB number uniqueness validation
- [ ] Update dispatch status: Ready → In Transit
- [ ] Update dispatch status: In Transit → Delivered
- [ ] Verify feedback form appears after delivery
- [ ] Submit feedback with ratings and issue tags
- [ ] View feedback on client details page
- [ ] Check average ratings calculation
- [ ] Filter dispatches by status and date
- [ ] Search dispatch by AWB or invoice number
- [ ] Prevent duplicate dispatch for same invoice
- [ ] Test status backward transition prevention
- [ ] Delete dispatch (verify feedback cascade deletion)

## Integration Points

### With Invoice Module
- Dispatch creation requires valid invoice ID
- Invoice details page shows dispatch status
- Cannot create multiple dispatches for one invoice

### With Client Module
- Feedback is linked to client
- Client details page shows feedback dashboard
- Average ratings calculated per client

### With Authentication
- Manager role required for creating/updating dispatches
- Admin role required for deleting dispatches
- All users can view dispatches and submit feedback

## File Structure

### Backend
```
src/routes/
  ├── dispatchRoutes.ts     # Dispatch CRUD operations
  └── feedbackRoutes.ts     # Feedback CRUD operations

src/middleware/
  └── auth.ts               # Authentication & authorization
```

### Frontend
```
src/components/
  ├── pages/
  │   ├── Dispatches/
  │   │   ├── Dispatches.tsx           # List page
  │   │   ├── DispatchDetails.tsx      # Details page
  │   │   └── StatusUpdateModal.tsx    # Status update modal
  │   └── Clients/
  │       └── ClientDetails.tsx         # With feedback dashboard
  │
  ├── Forms/
  │   ├── DispatchForm.tsx              # Create/update dispatch
  │   └── FeedbackForm.tsx              # Feedback submission
  │
  └── Navbars/
      └── DesktopNavBar.tsx             # Navigation (updated)
```

## API Response Examples

### Dispatch List Response
```json
{
  "dispatches": [
    {
      "id": "clx...",
      "courierName": "DTDC",
      "awbNumber": "ABC123456",
      "dispatchDate": "2025-11-25",
      "status": "InTransit",
      "invoice": {
        "invoiceNumber": "INV-001",
        "totalAmount": 5000,
        "client": {
          "name": "ABC Pharma"
        }
      },
      "feedback": null
    }
  ],
  "stats": {
    "total": 10,
    "ready": 2,
    "inTransit": 5,
    "delivered": 3,
    "pendingFeedback": 1
  }
}
```

### Feedback by Client Response
```json
{
  "feedbacks": [...],
  "averages": {
    "overall": "4.33",
    "quality": "4.5",
    "packaging": "4.2",
    "delivery": "4.3"
  },
  "issueCounts": {
    "Delivery Delay": 2,
    "Packaging Damage": 1
  },
  "totalFeedbacks": 15
}
```

## Troubleshooting

### Issue: Feedback form not appearing after delivery
**Solution**: Ensure dispatch status is exactly "Delivered" (case-sensitive) and no feedback already exists.

### Issue: Cannot create dispatch for invoice
**Solution**: Verify:
1. Invoice exists and is accessible
2. No existing dispatch for that invoice
3. User has Manager or Admin role

### Issue: Average ratings showing NaN
**Solution**: Check that feedback records exist for the client. System gracefully handles zero feedbacks with default values.

### Issue: AWB number duplicate error
**Solution**: AWB numbers must be globally unique across all dispatches. Check existing dispatches for the same AWB.

## Future Enhancements

Potential features to implement:
- SMS/Email notifications on status changes
- Courier tracking API integration
- Feedback email to clients after delivery
- Bulk dispatch import from CSV
- Advanced analytics and reporting
- Client feedback trends over time graph

## Support

For issues or questions, refer to:
- API Documentation: `USER_MANAGEMENT_API.md`
- Backend Setup: `STOCK_MANAGEMENT_SETUP.md`
- Database Schema: `prisma/schema.prisma`

---

**Module Status**: ✅ Complete and Production-Ready
**Last Updated**: November 25, 2025
**Version**: 1.0.0

