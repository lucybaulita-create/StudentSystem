-- Create user if it doesn't exist
CREATE USER users_user WITH ENCRYPTED PASSWORD 'users_password';

-- Create database
CREATE DATABASE users_db OWNER users_user;

-- Connect to the database and grant all privileges
\c users_db

-- Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE users_db TO users_user;

-- Grant schema privileges
GRANT ALL PRIVILEGES ON SCHEMA public TO users_user;

-- Allow future objects in schema to be accessible
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

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_verified ON users(is_verified);
