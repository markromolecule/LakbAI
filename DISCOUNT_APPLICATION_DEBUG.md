# Discount Application Debug Guide

## Current Issue
The user ID retrieval is failing, causing "User not authenticated" error during discount application submission.

## Enhanced Debug Solution

### What Was Added
1. **Comprehensive User ID Search**: The discount service now searches multiple AsyncStorage locations:
   - `user_session.dbUserData.id`
   - `auth0_user_sync_data.user.id` or `auth0_user_sync_data.data.user.id`
   - `auth0_sync_response.data.user.id`
   - `user_data.id`
   - `auth0_user_profile.user_id` or `auth0_user_profile.id`
   - All AsyncStorage keys containing 'user', 'auth', or 'session'
   - API lookup by Auth0 ID as last resort

2. **Detailed Logging**: Every step of user ID retrieval is logged for debugging

### Expected Log Output

When you test the discount application now, you should see logs like:

```
🔍 Searching for user ID in AsyncStorage...
📋 User session data keys: ["auth0Id", "email", "loginTime", "profileCompleted", "userId", "userType", "username"]
📋 Auth0 sync data: {...}
📋 Auth0 sync response: {"data": {"user": {"id": 21, ...}}}
✅ Found user ID from auth response: 21
📤 Uploading document to: http://192.168.254.104:8000/LakbAI/LakbAI-API/api/upload-discount-document
📝 Submitting application to: http://192.168.254.104:8000/LakbAI/LakbAI-API/api/discount-applications
📋 Application data: {userId: "21", discountType: "Student", documentPath: "uploads/discounts/...", documentName: "..."}
```

### What Should Happen

1. **Document Upload**: Should succeed and return file path
2. **User ID Retrieval**: Should find ID "21" from AsyncStorage
3. **Application Submission**: Should submit with proper user ID
4. **Database Storage**: Application should be stored with status "pending"
5. **File Storage**: Document should be saved in `/uploads/discounts/`

### If It Still Fails

The enhanced debug logging will show:
- All AsyncStorage keys available
- Contents of each relevant storage location
- Exactly where the user ID search fails
- API lookup attempts if storage fails

### Manual Testing Steps

1. **Clear App Data** (optional): Force fresh authentication
2. **Login**: Complete authentication flow
3. **Check Logs**: Verify user data is stored properly
4. **Apply for Discount**: Test the application submission
5. **Check Debug Logs**: See which method finds the user ID
6. **Verify in Admin**: Check if application appears in admin panel

### Database Verification

You can verify the application was submitted by checking:

```sql
SELECT * FROM users WHERE id = 21;
-- Should show discount_applied = 1, discount_status = 'pending'

SELECT * FROM users WHERE discount_status = 'pending';
-- Should show the new application
```

### File Verification

Check if documents are being uploaded:
```bash
ls -la /Applications/XAMPP/xamppfiles/htdocs/LakbAI/LakbAI-API/uploads/discounts/
```

Should show new files with timestamps matching the upload time.

## Known User Data from Logs

From the authentication logs, we know:
- **Database User ID**: 21
- **Auth0 ID**: "google-oauth2|101240322895612871649"
- **Email**: "livadomc@gmail.com"
- **Name**: "Mark Joseph Livado"

The enhanced user ID retrieval should find this information in AsyncStorage and use it for the discount application.
