# Discount Application Feature Implementation

## Overview
This document describes the complete implementation of the discount application feature where passengers can apply for fare discounts by uploading supporting documents, and admins can review and approve/reject these applications.

## Components Implemented

### 1. Mobile App (LakbAI-Mobile)
- **DiscountApplicationModal**: Enhanced modal for document upload and discount type selection
- **discountService**: Updated service to handle document upload and application submission
- **Profile Screen**: Integration with discount application modal

### 2. API Backend (LakbAI-API)
- **DiscountController**: Enhanced with new methods for handling discount applications
- **FileUploadController**: Handles document uploads to server storage
- **New API Endpoints**:
  - `POST /discount-applications` - Submit new discount application
  - `POST /upload-discount-document` - Upload discount document
  - `GET /discount-document` - Serve uploaded documents
  - `GET /admin/discount-applications` - Get all discount applications
  - `PATCH /users/{id}/discount` - Update discount status (approve/reject)

### 3. Admin Interface (LakbAI-Admin)
- **DiscountReviewModal**: Enhanced to display uploaded documents
- **UserService**: Updated methods for handling discount applications
- Document viewing functionality

### 4. Database Schema
- Enhanced users table with discount-related fields:
  - `discount_applied` - Boolean flag
  - `discount_file_path` - Path to uploaded document
  - `discount_status` - Enum (pending, approved, rejected)
  - `discount_amount` - Percentage amount for approved discounts

## Complete Flow

### Passenger Side (Mobile App)
1. Navigate to Profile → Fare Discount section
2. Click "Apply for discount"
3. Select discount type (Student, PWD, Senior Citizen)
4. Upload supporting document (photo or PDF)
5. Submit application
6. Application status is set to "pending"

### Admin Side (Web Interface)
1. View pending discount applications
2. Click on application to review details
3. View user information and uploaded document
4. Approve or reject with optional reason
5. System automatically sets discount percentage based on type

### API Processing
1. Document upload to `/uploads/discounts/` directory
2. Application data stored in database
3. Admin review updates status and discount amount
4. Passenger can see updated status in mobile app

## File Structure

```
LakbAI-Mobile/
├── components/common/DiscountApplicationModal.tsx (enhanced)
├── shared/services/discountService.ts (updated)
└── app/passenger/profile.tsx (integrated)

LakbAI-API/
├── controllers/DiscountController.php (enhanced)
├── controllers/FileUploadController.php (existing)
├── routes/api.php (updated with new endpoints)
├── uploads/discounts/ (document storage)
├── database/ensure_discount_fields.sql (schema update)
└── test_discount_application_flow.php (testing)

LakbAI-Admin/
├── src/services/userService.js (updated)
└── src/components/users/components/DiscountReviewModal.jsx (enhanced)
```

## Testing

Run the test script to verify the complete flow:
```bash
php /path/to/LakbAI-API/test_discount_application_flow.php
```

This will test:
- User registration
- Document upload simulation
- Application submission
- Status retrieval
- Admin approval/rejection process
- Complete workflow validation

## Security Considerations

1. **File Upload Security**:
   - Only allowed file types (PDF, JPG, PNG)
   - File size limits (5MB max)
   - Secure file naming with timestamps
   - Files stored outside web root when possible

2. **Access Control**:
   - Only authenticated users can submit applications
   - Only admins can approve/reject applications
   - Document access requires proper authentication

3. **Data Validation**:
   - Input validation on all endpoints
   - SQL injection prevention with prepared statements
   - XSS protection in admin interface

## Discount Types and Percentages

- **Student**: 15% discount
- **PWD (Person with Disability)**: 20% discount  
- **Senior Citizen**: 30% discount

Percentages are automatically assigned based on discount type when approved.

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/discount-applications` | Submit new discount application |
| POST | `/upload-discount-document` | Upload document file |
| GET | `/discount-document?path={path}` | Serve uploaded document |
| GET | `/users/{id}/discount` | Get user discount status |
| PATCH | `/users/{id}/discount` | Update discount status (admin) |
| GET | `/admin/discount-applications` | Get all discount applications |
| GET | `/admin/users/{id}/review` | Get user details for review |

## Database Updates Required

Run the following SQL script to ensure all required fields exist:
```sql
-- Run: LakbAI-API/database/ensure_discount_fields.sql
```

## Notes

1. The feature is fully integrated with the existing authentication system
2. Documents are stored locally in the `/uploads/discounts/` directory
3. The admin interface provides a complete review workflow
4. All endpoints include proper error handling and validation
5. The mobile app provides real-time feedback during the application process

## Future Enhancements

1. Email notifications for application status changes
2. Document expiration and renewal system
3. Bulk approval/rejection for admins
4. Advanced document verification (OCR, etc.)
5. Integration with external verification services
