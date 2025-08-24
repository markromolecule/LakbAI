-- Create or update users table to support Auth0 integration
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Auth0 specific fields
    auth0_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    name VARCHAR(255),
    nickname VARCHAR(255),
    picture TEXT,
    provider VARCHAR(100) DEFAULT 'auth0',
    connection VARCHAR(100),
    
    -- Application specific fields
    user_type ENUM('passenger', 'driver', 'admin') DEFAULT 'passenger',
    roles JSON, -- Store Auth0 roles as JSON array
    
    -- Profile information
    phone_number VARCHAR(20),
    address JSON, -- Store address as JSON object
    birthday DATE,
    gender ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    
    -- Status fields
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    profile_completed BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    -- Indexes
    INDEX idx_auth0_id (auth0_id),
    INDEX idx_email (email),
    INDEX idx_user_type (user_type),
    INDEX idx_is_active (is_active)
);

-- If you're updating an existing table, use these ALTER statements instead:

-- Add Auth0 specific columns if they don't exist
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS auth0_id VARCHAR(255) UNIQUE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS picture TEXT;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(100) DEFAULT 'auth0';
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS connection VARCHAR(100);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS roles JSON;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS address JSON;

-- Add indexes if they don't exist
-- ALTER TABLE users ADD INDEX IF NOT EXISTS idx_auth0_id (auth0_id);
-- ALTER TABLE users ADD INDEX IF NOT EXISTS idx_email (email);
