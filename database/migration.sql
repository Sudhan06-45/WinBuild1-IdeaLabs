-- ============================================================================
-- Data Migration Script: SQLite to SQL Server
-- ============================================================================
-- This script helps migrate data from the existing SQLite database
-- to SQL Server. Run this after running schema.sql
-- ============================================================================

-- IMPORTANT: Before running this script:
-- 1. Create the database in SQL Server (e.g., sqa_management)
-- 2. Run schema.sql to create the tables
-- 3. Export data from SQLite as CSV or use Python migration script
-- 4. Use the below INSERT statements or BULK INSERT to load data

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
-- If you have data in your SQLite database, use Python to export:
--
-- python migration_script.py
--
-- Or manually:
-- 1. Export users table from SQLite:
--    SELECT * FROM users;
-- 2. Export to CSV
-- 3. Use BULK INSERT in SQL Server
--
-- Example BULK INSERT:
-- BULK INSERT dbo.users
-- FROM 'C:\path\to\users.csv'
-- WITH (
--     FIELDTERMINATOR = ',',
--     ROWTERMINATOR = '\n',
--     FIRSTROW = 2,
--     TABLOCK
-- );

-- ============================================================================
-- Sample Inserts (if starting with fresh data)
-- ============================================================================

-- Verify tables were created
SELECT 'Users table' as [Status], COUNT(*) as [Record Count] FROM dbo.users
UNION ALL
SELECT 'User Sessions', COUNT(*) FROM dbo.user_sessions
UNION ALL
SELECT 'Agent Executions', COUNT(*) FROM dbo.agent_executions
UNION ALL
SELECT 'Documents', COUNT(*) FROM dbo.documents;

-- ============================================================================
-- END OF MIGRATION SCRIPT
-- ============================================================================
