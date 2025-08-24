# LakbAI API - Clean Architecture

## Folder Structure

```
LakbAI-API/
├── bootstrap/
│   └── app.php                 # Application bootstrap
├── config/
│   └── db.php                  # Database configuration
├── controllers/
│   └── AuthController.php      # Clean, lightweight controllers
├── src/
│   ├── helpers/
│   │   ├── ValidationHelper.php # Validation utilities
│   │   └── README.md           # Validation documentation
│   ├── repositories/
│   │   ├── BaseRepository.php  # Base CRUD operations
│   │   └── UserRepository.php  # User-specific database operations
│   ├── requests/
│   │   ├── BaseRequest.php     # Base request validation
│   │   ├── LoginRequest.php    # Login validation
│   │   └── RegisterRequest.php # Registration validation
│   ├── services/
│   │   └── AuthService.php     # Business logic layer
│   ├── providers/
│   │   ├── ServiceContainer.php    # Dependency injection container
│   │   ├── AuthServiceProvider.php # Auth services registration
│   │   └── AppServiceProvider.php  # Main application services
│   └── models/
│       └── User.php            # User model (simplified)
├── routes/
│   └── auth_routes.php         # Clean route handling
└── examples/
    ├── usage_example.php       # Usage examples
    └── registration_example.php # Registration examples
```

## Architecture Layers

### 1. **Controllers** 
- Lightweight and clean
- Handle HTTP requests/responses
- Delegate business logic to services
- Validate requests using Request classes

### 2. **Services**
- Contain business logic
- Orchestrate between repositories
- Handle complex operations
- Return consistent response formats

### 3. **Repositories**
- Handle database operations (CRUD)
- Abstract database queries
- Extend BaseRepository for common operations
- Follow single responsibility principle

### 4. **Requests**
- Validate incoming data
- Sanitize inputs
- Define validation rules
- Format data for services

### 5. **Providers**
- Manage dependency injection
- Register services in container
- Handle service lifecycle
- Bootstrap application dependencies

## Usage Examples

### Basic Controller Usage
```php
require_once __DIR__ . '/bootstrap/app.php';
require_once __DIR__ . '/controllers/AuthController.php';

$authController = new AuthController(app('Database'));
$result = $authController->register($userData);
```

### Direct Service Usage
```php
$authService = app('AuthService');
$result = $authService->login($email, $password);
```

### Repository Usage
```php
$userRepository = app('UserRepository');
$user = $userRepository->findByEmail($email);
```

## API Endpoints

All requests should be sent to `/routes/auth_routes.php` with an `action` parameter:

### Registration
```json
{
  "action": "register",
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "09123456789",
  "birthday": "1990-01-01",
  "gender": "Male",
  "house_number": "123",
  "street_name": "Main Street",
  "barangay": "Barangay 1",
  "city_municipality": "Manila",
  "province": "Metro Manila",
  "postal_code": "1234"
}
```

### Login
```json
{
  "action": "login",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### Get Profile
```json
{
  "action": "profile",
  "user_id": 1
}
```

### Update Profile
```json
{
  "action": "update_profile",
  "user_id": 1,
  "first_name": "Updated Name",
  "phone_number": "09111111111"
}
```

## Benefits of New Architecture

1. **Clean Separation of Concerns**
   - Controllers handle HTTP
   - Services handle business logic
   - Repositories handle data access
   - Requests handle validation

2. **Dependency Injection**
   - Loose coupling between components
   - Easy testing and mocking
   - Centralized service management

3. **Consistent Validation**
   - Reusable request classes
   - Centralized validation logic
   - Better error handling

4. **Maintainable Code**
   - Single responsibility principle
   - Easy to extend and modify
   - Clear code organization

5. **Scalable Architecture**
   - Easy to add new features
   - Supports complex business logic
   - Follows industry best practices

## 🔧 Adding New Features

### 1. Add New Repository Method
```php
// In UserRepository.php
public function findActiveUsers() {
    return $this->findAll(['is_active = ?' => 1]);
}
```

### 2. Add New Service Method
```php
// In AuthService.php
public function activateUser($userId) {
    return $this->userRepository->update($userId, ['is_active' => 1]);
}
```

### 3. Add New Request Validation
```php
// Create new request class
class UpdatePasswordRequest extends BaseRequest {
    public function validate() {
        // Add validation rules
    }
}
```

### 4. Add New Controller Method
```php
// In AuthController.php
public function activateUser($userId) {
    return $this->authService->activateUser($userId);
}
```

## 🧪 Testing

The new architecture makes testing much easier:

```php
// Mock dependencies for unit testing
$mockRepository = $this->createMock(UserRepository::class);
$mockValidator = $this->createMock(ValidationHelper::class);
$authService = new AuthService($mockRepository, $mockValidator);
```

This clean architecture provides a solid foundation for building scalable and maintainable APIs!
