# LakbAI Database Overview

## Quick Reference

### Database Details
- **Name**: `lakbai_db`
- **Engine**: InnoDB
- **Charset**: utf8mb4_unicode_ci
- **Tables**: 9
- **Foreign Keys**: 7 relationships

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | All system users | id, auth0_id, user_type, discount_type |
| `routes` | Jeepney routes | id, route_name, origin, destination |
| `checkpoints` | Route stops with fares | id, route_id, checkpoint_name, fare_from_origin |
| `jeepneys` | Fleet vehicles | id, jeepney_number, plate_number, driver_id |
| `drivers` | Driver-specific data | user_id, license_status, shift_status |
| `passengers` | Passenger-specific data | user_id, discount_type, discount_verified |
| `push_notification_tokens` | Mobile notifications | id, user_id, token, platform |
| `driver_earnings` | Driver earnings tracking | id, driver_id, trip_id, final_fare, transaction_date |
| `driver_shift_logs` | Driver shift management | id, driver_id, shift_date, start_time, end_time, status |

### Key Features

#### User Management
- **Auth0 Integration**: Supports Google, Facebook, email login
- **Role-based Access**: passenger, driver, admin
- **Discount System**: PWD, Senior Citizen, Student discounts
- **Document Verification**: Upload and approve discount documents

#### Route System
- **Two Main Routes**: SM Epza ↔ SM Dasmariñas
- **17 Checkpoints per Route**: Detailed stops with fare information
- **Fare Calculation**: Distance-based pricing from origin

#### Fleet Management
- **Jeepney Tracking**: Vehicle assignment and status
- **Driver Assignment**: Link drivers to specific jeepneys
- **Maintenance Status**: active, inactive, maintenance

#### Earnings System
- **Dynamic Earnings Tracking**: Real-time earnings calculation across multiple timeframes
- **Shift Management**: Track driver shifts with start/end times
- **Transaction History**: Complete record of all driver earnings
- **Period-based Calculations**: Daily, weekly, monthly, yearly, and all-time earnings

### Sample Data Included

#### Routes
1. **SM Epza → SM Dasmariñas** (17 checkpoints)
2. **SM Dasmariñas → SM Epza** (17 checkpoints)

#### Checkpoints (Sample)
- SM Epza (Origin) - ₱0.00
- Robinson Tejero - ₱8.00
- Malabon - ₱12.00
- Riverside - ₱15.00
- Lancaster New City - ₱18.00
- ...and more
- SM Dasmariñas (Destination) - ₱50.00

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/users` | GET | List all users |
| `/api/admin/pending-approvals` | GET | Get pending discount applications |
| `/api/admin/approve-discount` | POST | Approve/reject discounts |
| `/api/admin/jeepneys` | GET/POST | Manage jeepneys |
| `/api/admin/routes` | GET | Get routes with checkpoints |
| `/api/admin/checkpoints` | GET | Get checkpoints by route |
| `/api/earnings/driver/{id}` | GET | Get driver earnings summary |
| `/api/earnings/add` | POST | Add new earnings transaction |
| `/api/earnings/transactions/{driverId}` | GET | Get driver transaction history |
| `/api/earnings/shift/start` | POST | Start driver shift |
| `/api/earnings/shift/end` | POST | End driver shift |

### Setup Instructions

#### Quick Setup (Recommended)
```bash
cd LakbAI-API/database
./quick_setup.sh
```

#### Manual Setup
```bash
mysql -u root -p < setup_database.sql
```

#### Individual Tables
```bash
mysql -u root -p lakbai_db < create_users_table.sql
mysql -u root -p lakbai_db < create_routes_table.sql
mysql -u root -p lakbai_db < create_checkpoints_table.sql
mysql -u root -p lakbai_db < create_jeepney_table.sql
mysql -u root -p lakbai_db < create_drivers_table.sql
mysql -u root -p lakbai_db < create_passengers_table.sql
mysql -u root -p lakbai_db < create_push_notifications_table.sql
mysql -u root -p lakbai_db < create_earnings_table.sql
mysql -u root -p lakbai_db < create_shift_logs_table.sql
```

### Environment Configuration

#### .env File
```env
DB_HOST=localhost
DB_NAME=lakbai_db
DB_USER=root
DB_PASS=
DB_CHARSET=utf8mb4
```

### File Structure
```
database/
├── README.md                           # Complete documentation
├── DATABASE_OVERVIEW.md               # This file - quick reference
├── setup_database.sql                 # Complete setup script
├── quick_setup.sh                     # Automated setup script
├── create_users_table.sql             # Users table only
├── create_routes_table.sql            # Routes table only
├── create_checkpoints_table.sql       # Checkpoints table only
├── create_jeepney_table.sql           # Jeepneys table only
├── create_drivers_table.sql           # Drivers table only
├── create_passengers_table.sql        # Passengers table only
├── create_push_notifications_table.sql # Push tokens table only
├── create_earnings_table.sql          # Driver earnings table only
├── create_shift_logs_table.sql        # Driver shift logs table only
└── jiro(current_db).sql               # Original teammate's schema
```

### Common Queries

#### Get all users with discount status
```sql
SELECT id, first_name, last_name, user_type, discount_type, discount_verified 
FROM users 
WHERE discount_type IS NOT NULL;
```

#### Get route with all checkpoints
```sql
SELECT r.route_name, c.checkpoint_name, c.sequence_order, c.fare_from_origin
FROM routes r
JOIN checkpoints c ON r.id = c.route_id
WHERE r.id = 1
ORDER BY c.sequence_order;
```

#### Get jeepneys with driver info
```sql
SELECT j.jeepney_number, j.plate_number, j.status, u.first_name, u.last_name
FROM jeepneys j
LEFT JOIN drivers d ON j.driver_id = d.user_id
LEFT JOIN users u ON d.user_id = u.id;
```

#### Get driver earnings summary
```sql
SELECT 
    u.first_name, u.last_name,
    COUNT(de.id) as total_trips,
    SUM(de.final_fare) as total_earnings,
    AVG(de.final_fare) as average_fare
FROM users u
LEFT JOIN driver_earnings de ON u.id = de.driver_id
WHERE u.user_type = 'driver' AND u.id = ?
GROUP BY u.id;
```

#### Get active driver shifts
```sql
SELECT 
    u.first_name, u.last_name,
    dsl.shift_date, dsl.start_time, dsl.status
FROM driver_shift_logs dsl
JOIN users u ON dsl.driver_id = u.id
WHERE dsl.status = 'active'
ORDER BY dsl.start_time DESC;
```

### Troubleshooting

#### Common Issues
1. **Foreign Key Errors**: Ensure parent records exist
2. **Document Uploads**: Check `/uploads/documents/` directory permissions
3. **Auth0 Integration**: Verify Auth0 configuration and user ID mapping

#### Reset Database
```sql
DROP DATABASE lakbai_db;
-- Then run setup_database.sql again
```

### Support
- Check application logs for detailed error messages
- Verify database connectivity and permissions
- Review foreign key constraints
- Contact development team for assistance

---

**Last Updated**: September 2024  
**Version**: 1.0  
**Maintainer**: LakbAI Development Team
