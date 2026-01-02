# Database Configuration - SQA Management System

This folder contains the SQL Server database schema, migration scripts, and configuration files for the SQA Management System.

## 📁 Folder Contents

- **schema.sql** - SQL Server database schema definition (tables, indexes, views, stored procedures)
- **migration.sql** - SQL Server migration script with BULK INSERT examples
- **migrate_sqlite_to_sqlserver.py** - Python script to convert SQLite data to SQL Server
- **README.md** - This file

## 🔧 Setup Instructions

### 1. Create SQL Server Database

```sql
-- Create new database
CREATE DATABASE sqa_management;

-- Use the database
USE sqa_management;
```

### 2. Run Schema

Execute the `schema.sql` script to create tables:

```sql
-- Run in SQL Server Management Studio or Azure Data Studio
-- Open: database\schema.sql
-- Execute all statements
```

### 3. Migrate Existing Data (if applicable)

If you have existing SQLite data:

```bash
# From backend directory
cd ../database
python migrate_sqlite_to_sqlserver.py
```

This will generate:
- `users_insert.sql`
- `user_sessions_insert.sql`
- `agent_executions_insert.sql`
- `documents_insert.sql`

Then execute these files in SQL Server:

```sql
-- Run each generated INSERT file in SQL Server
-- Execute in order: users → user_sessions → agent_executions → documents
```

## 🗄️ Database Schema Overview

### Tables

1. **users** - User accounts and authentication
   - Stores: email, password hash, full name, admin flag
   
2. **user_sessions** - Session management
   - Stores: JWT tokens, expiration dates
   
3. **agent_executions** - Agent execution history
   - Stores: code, requirement, test, document agent executions
   - Tracks: input/output, status, execution time
   
4. **documents** - Generated SQA documents
   - Stores: document content, scores, metadata

### Views

- **vw_user_activity** - User activity summary with execution/document counts
- **vw_recent_executions** - Last 100 agent executions

### Stored Procedures

- **sp_get_user_dashboard_summary** - Get dashboard metrics for a user

## 📝 Environment Configuration

Create a `.env` file in the backend directory with these settings:

```env
# SQL Server Configuration
DATABASE_TYPE=sqlserver
MSSQL_SERVER=localhost
MSSQL_DATABASE=sqa_management
MSSQL_USERNAME=sa
MSSQL_PASSWORD=YourStrongPassword123
MSSQL_DRIVER=ODBC Driver 17 for SQL Server
```

For **Azure SQL Database**:

```env
DATABASE_TYPE=sqlserver
MSSQL_SERVER=your-server.database.windows.net
MSSQL_DATABASE=sqa_management
MSSQL_USERNAME=adminuser
MSSQL_PASSWORD=YourStrongPassword123
MSSQL_DRIVER=ODBC Driver 17 for SQL Server
```

## 🚀 Running with SQL Server

### 1. Install Dependencies

```bash
cd backend
pip install pyodbc
# Or for async support:
pip install aioodbc
```

### 2. Update requirements.txt

```
# Remove or comment out:
# aiosqlite>=0.19.0

# Add:
aioodbc>=0.5.0
pyodbc>=5.0.0
```

### 3. Run Application

```bash
cd backend
python main.py
```

## 🔐 Security Notes

- **Never** commit `.env` files with credentials
- Use environment variables for sensitive data
- For Azure SQL: Use Azure Entra ID authentication when possible
- Ensure MSSQL_PASSWORD meets complexity requirements
- Rotate credentials regularly

## 📊 Useful SQL Queries

### Check data integrity

```sql
-- Count records in each table
SELECT 
    'users' as [Table], COUNT(*) as [Count] FROM dbo.users
UNION ALL SELECT 'user_sessions', COUNT(*) FROM dbo.user_sessions
UNION ALL SELECT 'agent_executions', COUNT(*) FROM dbo.agent_executions
UNION ALL SELECT 'documents', COUNT(*) FROM dbo.documents;
```

### View user dashboard summary

```sql
-- Get dashboard summary for a user
EXEC sp_get_user_dashboard_summary @user_id = 1;
```

### Check user activity

```sql
-- View user activity summary
SELECT * FROM vw_user_activity
WHERE id = 1;
```

## 🔄 Backup and Restore

### Backup Database

```sql
BACKUP DATABASE sqa_management 
TO DISK = 'C:\backups\sqa_management.bak'
WITH INIT, COMPRESSION;
```

### Restore Database

```sql
RESTORE DATABASE sqa_management 
FROM DISK = 'C:\backups\sqa_management.bak'
WITH REPLACE;
```

## 📱 Local Development with SQL Server Express

1. Install [SQL Server Express](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
2. Install [SQL Server Management Studio (SSMS)](https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms)
3. Connect to `localhost` or `(local)\SQLEXPRESS`
4. Create database: `sqa_management`
5. Run `schema.sql`

## 🐳 Docker Setup (Optional)

```dockerfile
# Use SQL Server container
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourPassword123" \
  -p 1433:1433 \
  --name sqlserver \
  mcr.microsoft.com/mssql/server:2022-latest
```

Then connect to `localhost:1433` with user `sa`.

## 📚 References

- [SQL Server Documentation](https://learn.microsoft.com/en-us/sql/sql-server/)
- [Azure SQL Database](https://learn.microsoft.com/en-us/azure/azure-sql/)
- [SQLAlchemy + SQL Server](https://docs.sqlalchemy.org/en/20/dialects/mssql/)
- [pyodbc Documentation](https://github.com/mkleehammer/pyodbc/wiki)

## ❓ Troubleshooting

### Connection Issues

- Verify SQL Server is running
- Check firewall rules
- Ensure correct server name/username/password
- Test connection: `sqlcmd -S localhost -U sa -P your_password`

### Performance Issues

- Review query execution plans in SSMS
- Check indexes are created
- Monitor with Azure Monitor (for Azure SQL)
- Review database statistics

### Data Migration Issues

- Ensure schema.sql ran successfully
- Check SQLite database file exists and is readable
- Verify insert statement syntax matches your data types
- Run in batches if dealing with large datasets

---

**Last Updated**: January 2, 2026  
**Database Version**: SQL Server 2019+  
**Application**: SQA Management System
