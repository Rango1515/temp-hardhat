# MariaDB Database Setup Guide

This guide provides the SQL scripts needed to set up the VoIP Dialer database on your MariaDB server.

## Prerequisites

- MariaDB 10.5+ or MySQL 8.0+
- Database credentials configured in Lovable Cloud secrets:
  - `MARIADB_HOST`
  - `MARIADB_PORT`
  - `MARIADB_USER`
  - `MARIADB_PASSWORD`
  - `MARIADB_DATABASE`
  - `JWT_SECRET`

## Quick Setup

Connect to your MariaDB server and run the following scripts in order.

---

## 1. Create Database (if not exists)

```sql
CREATE DATABASE IF NOT EXISTS voip_dialer
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE voip_dialer;
```

---

## 2. Users Table

Stores all user accounts with authentication and role information.

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'client') DEFAULT 'client',
    status ENUM('active', 'suspended', 'pending') DEFAULT 'pending',
    signup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 3. API Keys Table

Manages API keys for external integrations.

```sql
CREATE TABLE api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    key_name VARCHAR(100) DEFAULT 'Default Key',
    api_key VARCHAR(64) NOT NULL UNIQUE,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiration_date TIMESTAMP NULL,
    status ENUM('active', 'revoked', 'expired') DEFAULT 'active',
    last_used TIMESTAMP NULL,
    usage_count INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_api_key (api_key),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 4. Phone Numbers Table

Inventory of all phone numbers (available, assigned, pending).

```sql
CREATE TABLE phone_numbers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    friendly_name VARCHAR(100),
    location_city VARCHAR(100),
    location_state VARCHAR(50),
    location_country VARCHAR(50) DEFAULT 'US',
    owner_id INT NULL,
    status ENUM('available', 'assigned', 'pending', 'suspended') DEFAULT 'available',
    number_type ENUM('local', 'toll_free', 'mobile') DEFAULT 'local',
    monthly_cost DECIMAL(10,2) DEFAULT 0.00,
    provider VARCHAR(50) DEFAULT 'mock',
    provider_sid VARCHAR(100) NULL,
    assigned_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_owner (owner_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 5. Calls Table

Logs all call activity with duration, status, and cost tracking.

```sql
CREATE TABLE calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    direction ENUM('outbound', 'inbound') DEFAULT 'outbound',
    duration_seconds INT DEFAULT 0,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    status ENUM('initiated', 'ringing', 'in_progress', 'completed', 'failed', 'busy', 'no_answer') DEFAULT 'initiated',
    call_sid VARCHAR(100) NULL,
    recording_url VARCHAR(500) NULL,
    cost DECIMAL(10,4) DEFAULT 0.0000,
    notes TEXT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_start_time (start_time),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 6. User Analytics Table

Aggregated statistics per user for dashboard display.

```sql
CREATE TABLE user_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    total_calls INT DEFAULT 0,
    successful_calls INT DEFAULT 0,
    failed_calls INT DEFAULT 0,
    total_duration_seconds INT DEFAULT 0,
    total_cost DECIMAL(10,2) DEFAULT 0.00,
    last_call_date TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 7. Number Requests Table

Tracks client requests for new phone numbers.

```sql
CREATE TABLE number_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    area_code VARCHAR(10) NULL,
    city_preference VARCHAR(100) NULL,
    number_type ENUM('local', 'toll_free', 'mobile') DEFAULT 'local',
    business_name VARCHAR(200) NULL,
    business_website VARCHAR(255) NULL,
    reason TEXT NULL,
    status ENUM('pending', 'approved', 'denied', 'fulfilled') DEFAULT 'pending',
    admin_notes TEXT NULL,
    assigned_number_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_number_id) REFERENCES phone_numbers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 8. Activity Logs Table

Audit trail for all system actions.

```sql
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NULL,
    entity_id INT NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_action (user_id, action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 9. Create Initial Admin User

Replace `YOUR_BCRYPT_HASH` with a bcrypt hash of your desired password.

You can generate a bcrypt hash using:
- Online: https://bcrypt-generator.com/
- Node.js: `require('bcrypt').hashSync('YourPassword123!', 10)`
- Python: `import bcrypt; bcrypt.hashpw(b'YourPassword123!', bcrypt.gensalt()).decode()`

```sql
INSERT INTO users (name, email, password_hash, role, status) VALUES 
('Admin', 'admin@yourdomain.com', 'YOUR_BCRYPT_HASH', 'admin', 'active');

-- Initialize analytics for admin user
INSERT INTO user_analytics (user_id, total_calls, successful_calls, failed_calls)
SELECT id, 0, 0, 0 FROM users WHERE email = 'admin@yourdomain.com';
```

---

## 10. Sample Data (Optional)

Add some test phone numbers to get started:

```sql
-- Sample available phone numbers
INSERT INTO phone_numbers (phone_number, friendly_name, location_city, location_state, status, number_type, monthly_cost) VALUES
('+19096871234', 'Ontario Local', 'Ontario', 'CA', 'available', 'local', 1.00),
('+19516543210', 'Riverside Local', 'Riverside', 'CA', 'available', 'local', 1.00),
('+18005551234', 'Toll Free 1', NULL, NULL, 'available', 'toll_free', 2.00),
('+18885559999', 'Toll Free 2', NULL, NULL, 'available', 'toll_free', 2.00),
('+12135550001', 'Los Angeles', 'Los Angeles', 'CA', 'available', 'local', 1.50);
```

---

## Verification

After running all scripts, verify the setup:

```sql
-- Check all tables exist
SHOW TABLES;

-- Verify table structure
DESCRIBE users;
DESCRIBE calls;
DESCRIBE phone_numbers;

-- Check admin user was created
SELECT id, name, email, role, status FROM users WHERE role = 'admin';

-- Check available phone numbers
SELECT phone_number, friendly_name, status FROM phone_numbers WHERE status = 'available';
```

---

## Troubleshooting

### Connection Issues
- Ensure your MariaDB server allows remote connections
- Check firewall rules for port 3306
- Verify the user has proper permissions:
  ```sql
  GRANT ALL PRIVILEGES ON voip_dialer.* TO 'your_user'@'%';
  FLUSH PRIVILEGES;
  ```

### Character Set Issues
If you encounter encoding problems:
```sql
ALTER DATABASE voip_dialer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## Next Steps

1. Run all SQL scripts on your MariaDB server
2. Verify secrets are configured in Lovable Cloud
3. Navigate to `/voip/auth` to create your first account
4. Log in with admin credentials to access the admin dashboard at `/voip/admin`
