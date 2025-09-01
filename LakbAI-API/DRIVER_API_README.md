# Driver Management API Documentation

## Overview
The Driver Management API provides secure CRUD operations for driver accounts. This API is **admin-only** and requires proper authentication to access any endpoint.

## Authentication
All endpoints require admin authentication. You can provide the admin ID in one of these ways:

1. **X-Admin-ID Header** (Recommended):
   ```
   X-Admin-ID: 1
   ```

2. **Authorization Header** (Bearer token format):
   ```
   Authorization: Bearer 1
   ```

3. **Query Parameter**:
   ```
   ?admin_id=1
   ```

4. **POST/JSON Body**:
   ```json
   {
     "admin_id": 1,
     "other_data": "..."
   }
   ```

## Base URL
```
http://your-domain/LakbAI/LakbAI-API/routes/driver.php
```

## Endpoints

### 1. GET /drivers
Retrieve all drivers.

**Request:**
```http
GET /drivers
X-Admin-ID: 1
```

**Response:**
```json
{
  "status": "success",
  "message": "Drivers retrieved successfully",
  "data": [
    {
      "driver_id": 1,
      "username": "driver1",
      "email": "driver1@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone_number": "09123456789",
      "gender": "Male",
      "birthday": "1990-01-15",
      "user_type": "driver",
      "house_number": "123",
      "street_name": "Main Street",
      "barangay": "Barangay 1",
      "city": "Manila",
      "province": "Metro Manila",
      "postal_code": "1000",
      "license_verification_status": false,
      "account_verified": true,
      "license_document": null,
      "created_at": "2024-01-01 00:00:00",
      "updated_at": "2024-01-01 00:00:00"
    }
  ]
}
```

### 2. GET /drivers/{id}
Retrieve a specific driver by ID.

**Request:**
```http
GET /drivers/1
X-Admin-ID: 1
```

**Response:**
```json
{
  "status": "success",
  "message": "Driver retrieved successfully",
  "data": {
    "driver_id": 1,
    "username": "driver1",
    "email": "driver1@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "09123456789",
    "gender": "Male",
    "birthday": "1990-01-15",
    "user_type": "driver",
    "house_number": "123",
    "street_name": "Main Street",
    "barangay": "Barangay 1",
    "city": "Manila",
    "province": "Metro Manila",
    "postal_code": "1000",
    "license_verification_status": false,
    "account_verified": true,
    "license_document": null,
    "created_at": "2024-01-01 00:00:00",
    "updated_at": "2024-01-01 00:00:00"
  }
}
```

### 3. POST /drivers/create
Create a new driver account.

**Request:**
```http
POST /drivers/create
X-Admin-ID: 1
Content-Type: application/json

{
  "username": "newdriver",
  "email": "newdriver@example.com",
  "password": "SecurePassword123",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone_number": "09187654321",
  "gender": "Female",
  "birthday": "1985-05-20",
  "house_number": "456",
  "street_name": "Oak Avenue",
  "barangay": "Barangay 2",
  "city": "Quezon City",
  "province": "Metro Manila",
  "postal_code": "1100",
  "account_verified": true,
  "license_verification_status": false
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Driver retrieved successfully",
  "data": {
    "driver_id": 2,
    "username": "newdriver",
    "email": "newdriver@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "phone_number": "09187654321",
    "gender": "Female",
    "birthday": "1985-05-20",
    "user_type": "driver",
    "house_number": "456",
    "street_name": "Oak Avenue",
    "barangay": "Barangay 2",
    "city": "Quezon City",
    "province": "Metro Manila",
    "postal_code": "1100",
    "license_verification_status": false,
    "account_verified": true,
    "license_document": null,
    "created_at": "2024-01-01 12:00:00",
    "updated_at": "2024-01-01 12:00:00"
  }
}
```

### 4. PUT /drivers/update/{id}
Update an existing driver account.

**Request:**
```http
PUT /drivers/update/1
X-Admin-ID: 1
Content-Type: application/json

{
  "first_name": "John Updated",
  "last_name": "Doe Updated",
  "license_verification_status": true,
  "account_verified": true
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Driver retrieved successfully",
  "data": {
    "driver_id": 1,
    "username": "driver1",
    "email": "driver1@example.com",
    "first_name": "John Updated",
    "last_name": "Doe Updated",
    "phone_number": "09123456789",
    "gender": "Male",
    "birthday": "1990-01-15",
    "user_type": "driver",
    "house_number": "123",
    "street_name": "Main Street",
    "barangay": "Barangay 1",
    "city": "Manila",
    "province": "Metro Manila",
    "postal_code": "1000",
    "license_verification_status": true,
    "account_verified": true,
    "license_document": null,
    "created_at": "2024-01-01 00:00:00",
    "updated_at": "2024-01-01 12:30:00"
  }
}
```

### 5. DELETE /drivers/delete/{id}
Delete a driver account.

**Request:**
```http
DELETE /drivers/delete/1
X-Admin-ID: 1
```

**Response:**
```json
{
  "status": "success",
  "message": "Driver deleted successfully"
}
```

## Field Descriptions

### Required Fields (for creation)
- `username`: Unique username (3-50 characters)
- `email`: Valid email address
- `password`: Secure password (minimum 6 characters)
- `first_name`: Driver's first name
- `last_name`: Driver's last name
- `phone_number`: Unique phone number
- `gender`: Must be "Male", "Female", or "Other"
- `birthday`: Date in YYYY-MM-DD format
- `house_number`: House/building number
- `street_name`: Street name
- `barangay`: Barangay name
- `city`: City/municipality name
- `province`: Province name
- `postal_code`: 4-digit postal code

### Optional Fields
- `account_verified`: Boolean (default: false)
- `license_verification_status`: Boolean (default: false)

### Read-only Fields
- `driver_id`: Auto-generated unique identifier
- `user_type`: Always set to "driver"
- `created_at`: Timestamp when record was created
- `updated_at`: Timestamp when record was last updated
- `license_document`: Path to license document (if uploaded)

## Error Responses

### Authentication Errors
```json
{
  "status": "error",
  "message": "Admin authentication required"
}
```
**HTTP Status:** 401

```json
{
  "status": "error",
  "message": "Invalid admin credentials or insufficient permissions"
}
```
**HTTP Status:** 403

### Validation Errors
```json
{
  "status": "error",
  "message": "Field 'username' is required"
}
```
**HTTP Status:** 400

```json
{
  "status": "error",
  "message": "Username already exists"
}
```
**HTTP Status:** 400

### Not Found Errors
```json
{
  "status": "error",
  "message": "Driver not found"
}
```
**HTTP Status:** 404

### Server Errors
```json
{
  "status": "error",
  "message": "Server error: Database connection failed"
}
```
**HTTP Status:** 500

## Security Features

1. **Admin-only Access**: All endpoints require admin authentication
2. **Password Hashing**: Passwords are securely hashed using `password_hash()`
3. **SQL Injection Protection**: All queries use PDO prepared statements
4. **Input Validation**: Comprehensive validation for all input fields
5. **Unique Constraints**: Enforces uniqueness for username, email, and phone number
6. **CORS Support**: Proper CORS headers for cross-origin requests

## Testing

Use the provided test script to verify the API functionality:

```bash
php test_driver_api.php
```

Make sure to:
1. Update the `$baseUrl` variable to match your server configuration
2. Update the `$adminId` variable to use an actual admin user ID from your database
3. Ensure your PHP server is running and accessible

## Database Schema

The driver data is stored in the `users` table with the following structure:

```sql
CREATE TABLE users (
    id INT(11) NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    birthday DATE NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    house_number VARCHAR(20) NOT NULL,
    street_name VARCHAR(100) NOT NULL,
    barangay VARCHAR(100) NOT NULL,
    city_municipality VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    postal_code CHAR(4) NOT NULL,
    user_type ENUM('passenger', 'driver', 'admin') NOT NULL DEFAULT 'passenger',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    drivers_license_verified BOOLEAN NOT NULL DEFAULT FALSE,
    drivers_license_path VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
```

## Notes

- The API automatically sets `user_type` to "driver" for all created accounts
- Passwords are automatically hashed using PHP's `password_hash()` function
- All timestamps are automatically managed by MySQL
- The API returns consistent JSON responses with proper HTTP status codes
- Error messages are user-friendly and descriptive
