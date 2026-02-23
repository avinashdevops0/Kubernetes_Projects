#!/bin/bash
set -e

echo "Waiting for MySQL to be ready..."
until mysql -uroot -p$MYSQL_ROOT_PASSWORD -e "SELECT 1" &>/dev/null; do
    echo "MySQL is unavailable - sleeping"
    sleep 2
done

echo "MySQL is ready! Initializing HR Manager databases..."

# Create databases
mysql -uroot -p$MYSQL_ROOT_PASSWORD <<EOF
CREATE DATABASE IF NOT EXISTS employee_db;
CREATE DATABASE IF NOT EXISTS department_db;
CREATE DATABASE IF NOT EXISTS leave_db;
CREATE DATABASE IF NOT EXISTS review_db;
CREATE DATABASE IF NOT EXISTS attendance_db;
CREATE DATABASE IF NOT EXISTS payroll_db;
CREATE DATABASE IF NOT EXISTS announcement_db;
EOF

echo "Databases created successfully!"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Initialize Employee database
mysql -uroot -p$MYSQL_ROOT_PASSWORD employee_db < $SCRIPT_DIR/employee-service/schema.sql
echo "Employee database initialized!"

# Initialize Department database
mysql -uroot -p$MYSQL_ROOT_PASSWORD department_db < $SCRIPT_DIR/department-service/schema.sql
echo "Department database initialized!"

# Initialize Leave database
mysql -uroot -p$MYSQL_ROOT_PASSWORD leave_db < $SCRIPT_DIR/leave-service/schema.sql
echo "Leave database initialized!"

# Initialize Review database
mysql -uroot -p$MYSQL_ROOT_PASSWORD review_db < $SCRIPT_DIR/review-service/schema.sql
echo "Review database initialized!"

# Initialize Attendance database
mysql -uroot -p$MYSQL_ROOT_PASSWORD attendance_db < $SCRIPT_DIR/attendance-service/schema.sql
echo "Attendance database initialized!"

# Initialize Payroll database
mysql -uroot -p$MYSQL_ROOT_PASSWORD payroll_db < $SCRIPT_DIR/payroll-service/schema.sql
echo "Payroll database initialized!"

# Initialize Announcement database
mysql -uroot -p$MYSQL_ROOT_PASSWORD announcement_db < $SCRIPT_DIR/announcement-service/schema.sql
echo "Announcement database initialized!"

echo "All databases initialized successfully!"
