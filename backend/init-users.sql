-- Initialize database users with proper passwords
-- This script runs during container initialization after postgres role is created

-- Set postgres user password
ALTER USER postgres WITH PASSWORD 'postgres';

-- Create users_user with password
CREATE ROLE users_user WITH LOGIN ENCRYPTED PASSWORD 'users_password';

-- Create users_db database
CREATE DATABASE users_db OWNER users_user;

-- Connect to users_db for permissions
\c users_db

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE users_db TO users_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO users_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO users_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO users_user;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(50) DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_verified ON users(is_verified);
