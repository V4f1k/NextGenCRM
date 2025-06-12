-- Initialize NextGenCRM database
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database user for the application (if needed)
-- Note: This is optional as we're using the default postgres user in development

-- Set timezone
SET timezone = 'UTC';

-- Log initialization
SELECT 'NextGenCRM database initialized successfully' as message;