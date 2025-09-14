# File Upload System Documentation

## Overview

The LakbAI file upload system has been restructured to provide better organization, security, and consistency across the application. All file uploads now follow a standardized structure with proper validation and security measures.

## Directory Structure

```
LakbAI/
├── uploads/                    # Main uploads directory (project root)
│   ├── .htaccess              # Security configuration
│   ├── license/               # License documents subdirectory
│   │   └── .htaccess          # Security configuration
│   └── [general documents]    # General user documents
└── LakbAI-API/
    └── uploads/               # DEPRECATED - No longer used
```

## File Upload Rules

### 1. General Documents
- **Location**: `uploads/` (project root)
- **Use Case**: User registration documents, discount documents, general files
- **Endpoint**: `POST /api/upload-document`
- **File Input Name**: `document`

### 2. License Documents
- **Location**: `uploads/license/`
- **Use Case**: Driver license documents
- **Endpoint**: `POST /api/upload-license`
- **File Input Name**: `license_document`

### 3. Prohibited Locations
- **Old discounts folder**: `LakbAI-API/uploads/discounts/` - **NO LONGER USED**
- All new uploads are prevented from using this location

## API Endpoints

### Upload Endpoints

#### General Document Upload
```
POST /api/upload-document
Content-Type: multipart/form-data

Form Data:
- document: [file] (required)
```

#### License Document Upload
```
POST /api/upload-license
Content-Type: multipart/form-data

Form Data:
- license_document: [file] (required)
```

### Serve Endpoints

#### Serve Document
```
GET /api/document?path=uploads/filename.ext
```

#### Serve License Document
```
GET /api/document?path=uploads/license/filename.ext
```

### Delete Endpoints

#### Delete Document
```
DELETE /api/delete-document
Content-Type: application/json

{
    "file_path": "uploads/filename.ext"
}
```

## File Validation

### Allowed File Types
- PDF documents
- JPG images
- JPEG images
- PNG images

### File Size Limits
- **Maximum**: 5MB per file
- **Minimum**: 100 bytes per file

### Security Validations
1. **File Extension Validation**: Only allowed extensions are accepted
2. **MIME Type Validation**: File content must match expected MIME type
3. **File Header Validation**: Image files must have proper headers
4. **Executable Content Detection**: Prevents upload of executable files
5. **Filename Sanitization**: Removes potentially dangerous characters
6. **File Size Validation**: Enforces size limits

### Error Handling
The system provides detailed error messages for various validation failures:
- File size exceeded
- Invalid file type
- Suspicious file content
- Upload errors
- File system errors

## Database Integration

### User Table Fields
- `discount_document_path`: Stores path to discount documents
- `discount_document_name`: Stores original filename
- `drivers_license_path`: Stores path to license documents (if applicable)
- `drivers_license_name`: Stores original license filename (if applicable)

### Path Format
- General documents: `uploads/filename.ext`
- License documents: `uploads/license/filename.ext`

## Security Features

### 1. Directory Protection
- `.htaccess` files prevent direct access to uploaded files
- Files can only be accessed through API endpoints

### 2. File Permissions
- Uploaded files are set to `0644` permissions
- Directories are set to `0755` permissions

### 3. Content Validation
- MIME type verification
- File header validation
- Executable content detection
- Filename sanitization

### 4. Path Security
- All file paths are validated before serving
- Only files within the uploads directory are accessible
- Path traversal attacks are prevented

## Migration from Old System

### Completed Migrations
1. **Directory Structure**: Created new uploads directory at project root
2. **File Migration**: Moved existing discount files to new location
3. **Database Update**: Updated file paths in database
4. **API Endpoints**: Added new endpoints while maintaining backward compatibility

### Backward Compatibility
- Old discount upload endpoints still work but are deprecated
- Existing file paths in database have been updated
- Legacy endpoints redirect to new system

## Usage Examples

### Frontend Integration

#### Upload General Document
```javascript
const formData = new FormData();
formData.append('document', file);

fetch('/api/upload-document', {
    method: 'POST',
    body: formData
})
.then(response => response.json())
.then(data => {
    if (data.status === 'success') {
        console.log('File uploaded:', data.data.file_path);
    }
});
```

#### Upload License Document
```javascript
const formData = new FormData();
formData.append('license_document', file);

fetch('/api/upload-license', {
    method: 'POST',
    body: formData
})
.then(response => response.json())
.then(data => {
    if (data.status === 'success') {
        console.log('License uploaded:', data.data.file_path);
    }
});
```

### Backend Integration

#### User Registration with Document
```php
// After successful file upload
$userData = [
    'username' => 'john_doe',
    'email' => 'john@example.com',
    // ... other user data
    'discount_document_path' => $uploadResult['data']['file_path'],
    'discount_document_name' => $uploadResult['data']['original_name']
];

$authController->register($userData);
```

## Error Codes and Messages

### Common Error Messages
- `No file uploaded`: No file was provided in the request
- `File size exceeds 5MB limit`: File is too large
- `Invalid file type`: File extension not allowed
- `File content appears to be suspicious`: Security validation failed
- `Failed to save file`: File system error during save
- `Validation failed`: General validation error with details

## Maintenance

### Regular Tasks
1. **Monitor Upload Directory**: Check for unusual file sizes or types
2. **Clean Old Files**: Remove orphaned files not referenced in database
3. **Security Audits**: Review uploaded files for security issues
4. **Backup**: Regular backup of uploads directory

### Troubleshooting
1. **Permission Issues**: Ensure upload directories have correct permissions
2. **File Size Issues**: Check PHP upload limits in php.ini
3. **Path Issues**: Verify file paths in database match actual files
4. **Security Issues**: Review .htaccess files and validation rules

## Future Enhancements

### Planned Features
1. **File Compression**: Automatic image compression for large files
2. **Virus Scanning**: Integration with antivirus scanning
3. **Cloud Storage**: Option to store files in cloud storage
4. **File Versioning**: Track file versions and changes
5. **Audit Logging**: Log all file operations for security

### Configuration Options
- File size limits can be adjusted in FileUploadController
- Allowed file types can be modified
- Security validation rules can be customized
- Upload directory structure can be extended
