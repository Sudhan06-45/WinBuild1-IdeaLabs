-- ============================================================================
-- SQA Management System - SQL Server Schema
-- ============================================================================
-- This schema defines the database structure for the SQA Management System
-- Database: SQL Server 2019+ / Azure SQL Database
-- Author: SQA Management Team
-- Last Modified: 2025-01-02
-- ============================================================================

-- Drop tables if they exist (for fresh setup)
-- Comment these out if you want to preserve existing data
/*
IF OBJECT_ID('dbo.documents', 'U') IS NOT NULL DROP TABLE dbo.documents;
IF OBJECT_ID('dbo.agent_executions', 'U') IS NOT NULL DROP TABLE dbo.agent_executions;
IF OBJECT_ID('dbo.user_sessions', 'U') IS NOT NULL DROP TABLE dbo.user_sessions;
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL DROP TABLE dbo.users;
*/

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
-- Stores user account information and authentication details
CREATE TABLE dbo.users (
    id INT PRIMARY KEY IDENTITY(1,1),
    uuid VARCHAR(36) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NULL,
    is_active BIT DEFAULT 1,
    is_admin BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Create indexes for users table
CREATE INDEX idx_users_uuid ON dbo.users(uuid);
CREATE INDEX idx_users_email ON dbo.users(email);

-- ============================================================================
-- 2. USER_SESSIONS TABLE
-- ============================================================================
-- Manages user authentication tokens and session expiration
CREATE TABLE dbo.user_sessions (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL FOREIGN KEY REFERENCES dbo.users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at DATETIME2 NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Create index for user_sessions
CREATE INDEX idx_user_sessions_user_id ON dbo.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON dbo.user_sessions(token);

-- ============================================================================
-- 3. AGENT_EXECUTIONS TABLE
-- ============================================================================
-- Tracks all agent executions (code, requirement, test, document)
CREATE TABLE dbo.agent_executions (
    id INT PRIMARY KEY IDENTITY(1,1),
    uuid VARCHAR(36) UNIQUE NOT NULL,
    user_id INT NOT NULL FOREIGN KEY REFERENCES dbo.users(id) ON DELETE CASCADE,
    agent_type VARCHAR(50) NOT NULL,  -- 'code', 'requirement', 'test', 'document'
    input_data NVARCHAR(MAX) NULL,    -- JSON
    output_data NVARCHAR(MAX) NULL,   -- JSON
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'running', 'completed', 'failed'
    error_message NVARCHAR(MAX) NULL,
    execution_time_ms INT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    completed_at DATETIME2 NULL
);

-- Create indexes for agent_executions
CREATE INDEX idx_agent_executions_uuid ON dbo.agent_executions(uuid);
CREATE INDEX idx_agent_executions_user_id ON dbo.agent_executions(user_id);
CREATE INDEX idx_agent_executions_agent_type ON dbo.agent_executions(agent_type);
CREATE INDEX idx_agent_executions_status ON dbo.agent_executions(status);

-- ============================================================================
-- 4. DOCUMENTS TABLE
-- ============================================================================
-- Stores generated SQA documents and reports
CREATE TABLE dbo.documents (
    id INT PRIMARY KEY IDENTITY(1,1),
    uuid VARCHAR(36) UNIQUE NOT NULL,
    user_id INT NOT NULL FOREIGN KEY REFERENCES dbo.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) DEFAULT 'sqa_report',  -- 'sqa_report', 'code_review', 'test_report'
    code_execution_id INT NULL FOREIGN KEY REFERENCES dbo.agent_executions(id),
    requirement_execution_id INT NULL FOREIGN KEY REFERENCES dbo.agent_executions(id),
    test_execution_id INT NULL FOREIGN KEY REFERENCES dbo.agent_executions(id),
    content NVARCHAR(MAX) NULL,        -- JSON
    summary NVARCHAR(MAX) NULL,
    overall_score INT NULL,
    compliance_score INT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Create indexes for documents
CREATE INDEX idx_documents_uuid ON dbo.documents(uuid);
CREATE INDEX idx_documents_user_id ON dbo.documents(user_id);
CREATE INDEX idx_documents_document_type ON dbo.documents(document_type);

-- ============================================================================
-- VIEWS (Optional - for common queries)
-- ============================================================================

-- View: User Activity Summary
CREATE OR ALTER VIEW vw_user_activity AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    COUNT(DISTINCT ae.id) as total_executions,
    COUNT(DISTINCT CASE WHEN ae.status = 'completed' THEN ae.id END) as completed_executions,
    COUNT(DISTINCT CASE WHEN ae.status = 'failed' THEN ae.id END) as failed_executions,
    COUNT(DISTINCT d.id) as total_documents,
    MAX(ae.created_at) as last_execution_date
FROM dbo.users u
LEFT JOIN dbo.agent_executions ae ON u.id = ae.user_id
LEFT JOIN dbo.documents d ON u.id = d.user_id
GROUP BY u.id, u.email, u.full_name;

-- View: Recent Executions
CREATE OR ALTER VIEW vw_recent_executions AS
SELECT TOP 100
    ae.id,
    ae.uuid,
    u.email,
    ae.agent_type,
    ae.status,
    ae.execution_time_ms,
    ae.created_at,
    ae.completed_at
FROM dbo.agent_executions ae
INNER JOIN dbo.users u ON ae.user_id = u.id
ORDER BY ae.created_at DESC;

-- ============================================================================
-- STORED PROCEDURES (Optional - for common operations)
-- ============================================================================

-- Procedure: Get User Dashboard Summary
CREATE OR ALTER PROCEDURE sp_get_user_dashboard_summary
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT
        (SELECT COUNT(*) FROM dbo.agent_executions WHERE user_id = @user_id AND CAST(created_at AS DATE) = CAST(GETUTCDATE() AS DATE)) AS today_executions,
        (SELECT COUNT(*) FROM dbo.agent_executions WHERE user_id = @user_id AND status = 'completed') AS total_completed,
        (SELECT COUNT(*) FROM dbo.documents WHERE user_id = @user_id) AS total_documents,
        (SELECT AVG(CAST(overall_score AS FLOAT)) FROM dbo.documents WHERE user_id = @user_id AND overall_score IS NOT NULL) AS avg_score;
END;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
