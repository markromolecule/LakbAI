#!/bin/bash

# =============================================
# LakbAI Database Quick Setup Script
# =============================================
# This script quickly sets up the LakbAI database
# Usage: ./quick_setup.sh [mysql_user] [mysql_password]

# Default MySQL credentials
MYSQL_USER=${1:-root}
MYSQL_PASS=${2:-""}
DB_NAME="lakbai_db"

echo "Setting up LakbAI Database..."
echo "Database: $DB_NAME"
echo "User: $MYSQL_USER"
echo "=================================="

# Check if MySQL is running
if ! pgrep -x "mysqld" > /dev/null; then
    echo "MySQL is not running. Please start MySQL first."
    exit 1
fi

# Create database and run setup script
echo "Creating database and tables..."

if [ -z "$MYSQL_PASS" ]; then
    mysql -u "$MYSQL_USER" < setup_database.sql
else
    mysql -u "$MYSQL_USER" -p"$MYSQL_PASS" < setup_database.sql
fi

if [ $? -eq 0 ]; then
    echo "Database setup completed successfully!"
    echo ""
    echo "Database Summary:"
    echo "   - Database: $DB_NAME"
    echo "   - Tables: 7 (users, routes, checkpoints, drivers, passengers, jeepneys, push_notification_tokens)"
    echo "   - Sample Routes: 2 (SM Epza ↔ SM Dasmariñas)"
    echo "   - Sample Checkpoints: 34 (17 per route)"
    echo ""
    echo "Next Steps:"
    echo "   1. Update your .env file with database credentials"
    echo "   2. Start the API server"
    echo "   3. Test the endpoints"
    echo ""
    echo "For detailed documentation, see README.md"
else
    echo "Database setup failed. Please check the error messages above."
    exit 1
fi
