# 🧪 Formulation Management Module - Setup Guide

## Overview
The Formulation Management module provides complete version control and management for product formulations. This implementation includes:

- ✅ **Create formulations** with initial ingredients
- ✅ **Version control** - Create unlimited versions with full audit trail
- ✅ **Lock/Unlock versions** - Approve versions for production
- ✅ **Version comparison** - Side-by-side comparison with change highlights
- ✅ **Rollback functionality** - Revert to previous versions
- ✅ **Real-time composition tracking** - Ensure 100% total composition
- ✅ **Creator tracking** - Automatic user attribution via JWT

## Features Implemented

### 1. Formulation List Page
**File**: `src/components/pages/FormulationsRnD/FormulationsAndRnD.tsx`

**Features**:
- Display all formulations with their latest version
- Search by formulation name
- Filter by lock status (all, with locked versions)
- Lock status indicators
- Navigate to detailed version view
- Create new formulations
- Delete formulations

### 2. Formulation Creation Form
**File**: `src/components/Forms/FormulationForm.tsx`

**Features**:
- Product name input
- Dynamic ingredient array (add/remove)
- Material selection from stock
- Percentage/composition input with units
- Real-time total composition calculation
- Visual feedback for 100% composition target
- Optional notes per ingredient
- Validation with Zod schema

### 3. Formulation Details Page
**File**: `src/components/pages/FormulationsRnD/FormulationDetails.tsx`

**Features**:
- Version history timeline
- Select and view any version
- Lock/unlock versions
- Create new versions
- Rollback to previous versions
- Compare multiple versions
- View creator information and timestamps
- Display ingredient composition table

### 4. Version Creation Modal
**File**: `src/components/pages/FormulationsRnD/VersionModal.tsx`

**Features**:
- Create new version for existing formulation
- Full ingredient editor
- Version notes
- Real-time composition validation
- Material selection

### 5. Version Comparison Modal
**File**: `src/components/pages/FormulationsRnD/VersionComparisonModal.tsx`

**Features**:
- Select two versions to compare
- Visual summary of changes (added/removed/modified)
- Detailed change breakdown
- Highlight composition differences
- Show percentage changes

## API Integration

### Endpoints Used

1. **GET** `/api/formulations` - List all formulations
   - Query params: `locked` (true/false)

2. **POST** `/api/formulations` - Create new formulation
   ```json
   {
     "productName": "Herbal Face Cream",
     "initialIngredients": [...],
     "creatorId": "auto-from-JWT"
   }
   ```

3. **GET** `/api/formulations/:id` - Get formulation details

4. **POST** `/api/formulations/:id/versions` - Create new version
   ```json
   {
     "ingredients": [...],
     "notes": "Version notes",
     "creatorId": "auto-from-JWT"
   }
   ```

5. **PATCH** `/api/formulations/:id/versions/:versionNumber/lock` - Lock/unlock version
   ```json
   {
     "isLocked": true,
     "notes": "Approval notes"
   }
   ```

6. **POST** `/api/formulations/:id/rollback` - Rollback to version
   ```json
   {
     "targetVersionNumber": 2,
     "notes": "Rollback notes"
   }
   ```

7. **GET** `/api/formulations/:id/compare?version1=1&version2=2` - Compare versions

8. **DELETE** `/api/formulations/:id` - Delete formulation

## Components Structure

```
src/
├── components/
│   ├── Forms/
│   │   └── FormulationForm.tsx          # New formulation creation
│   ├── pages/
│   │   ├── FormulationsRnD/
│   │   │   ├── FormulationsAndRnD.tsx   # Main list page
│   │   │   ├── FormulationDetails.tsx   # Detailed version view
│   │   │   ├── VersionModal.tsx         # Create new version
│   │   │   └── VersionComparisonModal.tsx # Compare versions
│   │   └── _components/
│   │       └── FormModal.tsx            # Updated with formulation support
│   └── Home.tsx                         # Route configuration
```

## Routes

```tsx
/production/formulations-and-rd          // List all formulations
/production/formulations/:id             // Formulation details & versions
```

## Key Features Explained

### Version Control System
- Each formulation can have unlimited versions
- Versions are numbered sequentially (V1, V2, V3...)
- Each version has complete ingredient list
- Versions can be independently locked/unlocked
- Locked versions cannot be modified (approved for production)

### Composition Tracking
- Real-time calculation of total percentage
- Visual indicators for 100% target
- Warning when composition ≠ 100%
- Per-ingredient percentage input

### Audit Trail
- Creator information stored automatically
- Timestamps for all versions
- Version notes for change documentation
- Complete change history

### Version Comparison
- Side-by-side version metadata
- Added ingredients (green)
- Removed ingredients (red)
- Modified ingredients (blue) with difference calculations
- Visual change summary

### Rollback Functionality
- Create new version from any previous version
- Maintains complete version history
- Confirmation dialog to prevent accidents
- Automatic version numbering

## User Permissions

Based on backend API:
- **Admin**: Full access to all operations
- **InventoryManager**: Can create/view formulations
- **ProductionManager**: Can create/view formulations, lock versions
- **Supervisor**: View only
- **Staff**: View only

Lock/unlock operations require manager role.

## Usage Flow

### Creating a New Formulation
1. Click "Create" button on formulations list
2. Enter product name
3. Add ingredients (select material, enter percentage, add notes)
4. Ensure total = 100%
5. Submit → Creates formulation with V1

### Creating a New Version
1. Open formulation details
2. Click "New Version" button
3. Add/modify ingredients
4. Add version notes (recommended)
5. Submit → Creates next version number

### Locking a Version for Production
1. Open formulation details
2. Select version from timeline
3. Click "Lock" button on version card
4. Version is now approved for production
5. Can be unlocked if needed

### Comparing Versions
1. Open formulation details
2. Click "Compare Versions" button
3. Select two versions from dropdowns
4. View detailed change breakdown

### Rolling Back to Previous Version
1. Open formulation details
2. Select older version from timeline
3. Click "Rollback" button
4. Confirm action
5. Creates new version with old ingredients

## Validation Rules

### Formulation Creation
- Product name: min 2 characters, required
- At least 1 ingredient required
- Each ingredient needs:
  - Material selection (required)
  - Percentage/composition (≥ 0, required)
  - Unit (required)
  - Notes (optional)

### Version Creation
- At least 1 ingredient required
- Same validation as formulation creation
- Version notes optional but recommended

## Styling & UX

### Color Coding
- **Green**: Locked/approved versions, added ingredients
- **Red**: Remove actions, removed ingredients
- **Blue**: Primary actions, modified ingredients
- **Yellow**: Composition warnings, unlocked status
- **Purple**: Rollback actions

### Responsive Design
- Mobile-friendly tables
- Collapsible sections
- Scroll containers for long content
- Touch-friendly buttons

### Loading States
- Skeleton loaders during data fetch
- Disabled buttons during submission
- Loading text indicators

### Error Handling
- API error messages displayed
- Form validation errors
- Confirmation dialogs for destructive actions

## Technical Details

### State Management
- React hooks (useState, useEffect)
- React Router for navigation
- AuthContext for user data

### Forms & Validation
- React Hook Form for form state
- Zod for schema validation
- Dynamic field arrays with useFieldArray

### API Communication
- Axios instance from `@/lib/api`
- Automatic JWT token injection
- Error handling with try-catch

### Type Safety
- TypeScript interfaces for all data structures
- Zod schemas ensure runtime validation
- Generic component types

## Testing Checklist

- [ ] Create new formulation
- [ ] Add multiple ingredients
- [ ] Verify 100% composition validation
- [ ] Create second version
- [ ] Lock a version
- [ ] Unlock a version
- [ ] Compare two versions
- [ ] Rollback to previous version
- [ ] Delete formulation
- [ ] Search formulations
- [ ] Filter by lock status
- [ ] View creator information
- [ ] Test with different user roles

## Future Enhancements

Potential additions:
- Bulk ingredient import
- Formulation templates
- Version diff view (Git-style)
- Export to PDF
- Batch operations on multiple formulations
- Advanced search and filters
- Formulation categories/tags
- Cost calculation per formulation
- Integration with batch production

## Troubleshooting

### Common Issues

**Issue**: "Material is required" error
- **Solution**: Ensure materials are loaded from `/api/stock/materials`

**Issue**: Composition doesn't equal 100%
- **Solution**: This is a warning, not a blocker. Adjust percentages as needed.

**Issue**: "Version not found" error
- **Solution**: Check version number in URL matches existing version

**Issue**: Can't lock version
- **Solution**: Ensure user has manager role (Admin, InventoryManager, ProductionManager)

## Dependencies

```json
{
  "react-hook-form": "^7.x",
  "@hookform/resolvers": "^3.x",
  "zod": "^3.x",
  "axios": "^1.x",
  "lucide-react": "^0.x",
  "react-router-dom": "^6.x"
}
```

## Backend Requirements

Ensure backend implements all endpoints documented in `FORMULATION_API.md`:
- Formulation CRUD
- Version management
- Lock/unlock functionality
- Version comparison
- Rollback feature

## Summary

This implementation provides a complete, production-ready formulation management system with:
- Full version control
- Approval workflows
- Change tracking
- User-friendly interface
- Real-time validation
- Comprehensive audit trail

The module integrates seamlessly with the existing UMMS architecture and follows established patterns for consistency.

