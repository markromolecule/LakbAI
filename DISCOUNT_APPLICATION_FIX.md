# Discount Application Error Fix

## Issue
The mobile app was trying to upload discount documents to the wrong endpoint, causing the error:
```
Upload response error: {"status":"error","message":"No action provided"}
```

## Root Cause
The discount service was using the Auth0 endpoint (`/routes/auth0.php`) for document upload instead of the proper API endpoints.

## Solution Applied

### 1. Fixed URL Construction
- Updated `discountService.ts` to use proper API URLs
- Added `buildApiEndpoint()` method for consistent URL construction
- Fixed endpoint URLs to use the correct API structure

### 2. Fixed User ID Retrieval
- Enhanced `getUserId()` method to properly extract user ID from session storage
- Added fallback to Auth0 profile data
- User ID now correctly retrieved from database user data (ID: 21 in the logs)

### 3. Added Debug Logging
- Added comprehensive logging to troubleshoot upload and application submission
- Logs now show:
  - API URLs being used
  - User ID retrieval process
  - Document details
  - Application submission data

## URL Structure Fixed

### Before (Incorrect)
```
Upload URL: http://192.168.254.104:8000/routes/auth0.php
Application URL: http://192.168.254.104:8000/routes/auth0.php
```

### After (Correct)
```
Upload URL: http://192.168.254.104:8000/LakbAI/LakbAI-API/api/upload-discount-document
Application URL: http://192.168.254.104:8000/LakbAI/LakbAI-API/api/discount-applications
```

## Testing Instructions

1. **Test Document Upload**:
   - Open mobile app
   - Navigate to Profile → Apply for discount
   - Select discount type (Student/PWD/Senior Citizen)
   - Upload a document (photo or PDF)
   - Check console logs for proper URL and successful upload

2. **Expected Log Output**:
   ```
   📤 Uploading document to: http://192.168.254.104:8000/LakbAI/LakbAI-API/api/upload-discount-document
   📄 Document details: {name: "photo_123456.jpg", type: "image/jpeg", uri: "file:///..."}
   ✅ Found user ID from session: 21
   📝 Submitting application to: http://192.168.254.104:8000/LakbAI/LakbAI-API/api/discount-applications
   📋 Application data: {userId: "21", discountType: "Student", documentPath: "uploads/discounts/...", documentName: "photo_123456.jpg"}
   ```

3. **Verify in Admin Panel**:
   - Login to admin interface
   - Check pending discount applications
   - Should see the new application with uploaded document
   - Document should be viewable

## Files Modified

1. `/LakbAI-Mobile/shared/services/discountService.ts`
   - Fixed URL construction
   - Enhanced user ID retrieval
   - Added debug logging

## Database Verification

The user from the logs (ID: 21, email: livadomc@gmail.com) should now be able to:
1. Upload discount documents successfully
2. Submit discount applications
3. Have applications appear in admin panel for review

## Next Steps

1. Test the complete flow with the mobile app
2. Verify documents are stored in `/uploads/discounts/` directory
3. Check admin interface can view and approve applications
4. Remove debug logging once confirmed working (optional)

## Error Handling

The service now includes proper error handling for:
- Missing user authentication
- Failed document uploads
- Invalid API responses
- Network connectivity issues
