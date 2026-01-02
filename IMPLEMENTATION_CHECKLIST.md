# ✅ SQL Server Migration - Implementation Checklist

## 📋 Pre-Setup Checklist

- [ ] **Read Documentation**
  - [ ] Read `DATABASE_SETUP.md` (main setup guide)
  - [ ] Read `SQL_SERVER_MIGRATION.md` (overview)
  - [ ] Read `FILES_CREATED.md` (what was created)

- [ ] **System Requirements**
  - [ ] Windows 10/11 or SQL Server compatible OS
  - [ ] 2+ GB RAM available
  - [ ] 500 MB+ disk space for SQL Server
  - [ ] .NET Framework 4.6+ installed

## 🔧 Installation Checklist

### SQL Server Installation

- [ ] **SQL Server Express** (Local Development)
  - [ ] Download from [Microsoft](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
  - [ ] Run installer
  - [ ] Accept default settings
  - [ ] Note: Installation takes 10-15 minutes

- [ ] **SQL Server Management Studio (SSMS)** (Local Development)
  - [ ] Download from [Microsoft](https://learn.microsoft.com/sql/ssms/download-sql-server-management-studio-ssms)
  - [ ] Install SSMS
  - [ ] Launch SSMS and connect to `localhost`
  - [ ] Verify connection successful

- [ ] **Azure SQL Database** (Production Alternative)
  - [ ] Create Azure account (if needed)
  - [ ] Create resource group in Azure Portal
  - [ ] Create Azure SQL Database
  - [ ] Note server name: `your-server.database.windows.net`
  - [ ] Note admin username and password
  - [ ] Configure firewall rules for your IP

## 🗄️ Database Setup Checklist

- [ ] **Create Database**
  - [ ] Open SSMS
  - [ ] Right-click Databases → New Database
  - [ ] Name: `sqa_management`
  - [ ] Click OK

- [ ] **Run Schema Script**
  - [ ] Open `database/schema.sql` in SSMS
  - [ ] Click Execute (F5)
  - [ ] Wait for "Command completed successfully"
  - [ ] Verify tables created:
    ```sql
    SELECT name FROM sys.tables;
    ```

- [ ] **Verify Schema**
  - [ ] Check 4 tables exist: users, user_sessions, agent_executions, documents
  - [ ] Check indexes are created
  - [ ] Check views exist (vw_user_activity, vw_recent_executions)

## 🐍 Python Setup Checklist

- [ ] **Install Python Packages**
  - [ ] Open terminal/PowerShell
  - [ ] Navigate to `backend` directory
  - [ ] Run: `pip install pyodbc`
  - [ ] Run: `pip install aioodbc`
  - [ ] Verify: `pip list` shows both packages

- [ ] **Update requirements.txt**
  - [ ] Open `backend/requirements.txt`
  - [ ] Comment out or remove: `aiosqlite>=0.19.0`
  - [ ] Ensure `sqlalchemy>=2.0.0` is present
  - [ ] Ensure `pyodbc>=5.0.0` is present
  - [ ] Ensure `aioodbc>=0.5.0` is present

## ⚙️ Configuration Checklist

- [ ] **Update .env File**
  - [ ] Copy `.env.example` to `.env` (if needed)
  - [ ] Set `DATABASE_TYPE=sqlserver`
  - [ ] Set `MSSQL_SERVER=localhost` (or your server)
  - [ ] Set `MSSQL_DATABASE=sqa_management`
  - [ ] Set `MSSQL_USERNAME=sa` (or your username)
  - [ ] Set `MSSQL_PASSWORD=YourPassword123` (your actual password)
  - [ ] Set `MSSQL_DRIVER=ODBC Driver 17 for SQL Server`
  - [ ] Set proper `SECRET_KEY` (min 32 characters)
  - [ ] Set `JWT_SECRET_KEY` (min 32 characters)

- [ ] **Add .env to .gitignore**
  - [ ] Open `.gitignore` in root
  - [ ] Add line: `.env`
  - [ ] Add line: `.env.local`
  - [ ] Save file

## 🔄 Data Migration Checklist (Optional)

Only if you have existing SQLite data:

- [ ] **Prepare Migration**
  - [ ] Ensure `sqa_dev.db` exists in `backend` directory
  - [ ] Verify SQLite database has data
  - [ ] Backup SQLite database (copy sqa_dev.db)

- [ ] **Run Migration Script**
  - [ ] Navigate to `database` folder
  - [ ] Run: `python migrate_sqlite_to_sqlserver.py`
  - [ ] Wait for completion
  - [ ] Check for generated SQL files:
    - [ ] users_insert.sql
    - [ ] user_sessions_insert.sql
    - [ ] agent_executions_insert.sql
    - [ ] documents_insert.sql

- [ ] **Import Data to SQL Server**
  - [ ] Open SSMS
  - [ ] Open `users_insert.sql`
  - [ ] Execute (F5)
  - [ ] Open `user_sessions_insert.sql`
  - [ ] Execute (F5)
  - [ ] Open `agent_executions_insert.sql`
  - [ ] Execute (F5)
  - [ ] Open `documents_insert.sql`
  - [ ] Execute (F5)

- [ ] **Verify Migrated Data**
  - [ ] Run in SSMS:
    ```sql
    SELECT COUNT(*) as UserCount FROM dbo.users;
    SELECT COUNT(*) as SessionCount FROM dbo.user_sessions;
    SELECT COUNT(*) as ExecutionCount FROM dbo.agent_executions;
    SELECT COUNT(*) as DocumentCount FROM dbo.documents;
    ```

## 🧪 Testing Checklist

- [ ] **Connection Test**
  - [ ] Create `test_connection.py` in `backend`:
    ```python
    import pyodbc
    conn_str = (
        'DRIVER={ODBC Driver 17 for SQL Server};'
        'SERVER=localhost;'
        'DATABASE=sqa_management;'
        'UID=sa;'
        'PWD=YourPassword123'
    )
    conn = pyodbc.connect(conn_str)
    print("✓ Connection successful!")
    conn.close()
    ```
  - [ ] Run: `python test_connection.py`
  - [ ] Verify: "Connection successful!" message

- [ ] **Application Startup**
  - [ ] Navigate to `backend` directory
  - [ ] Run: `python main.py`
  - [ ] Wait for: "Application startup complete"
  - [ ] Check for any connection errors
  - [ ] Verify no database errors in output

- [ ] **API Health Check**
  - [ ] Open browser: `http://localhost:8000/health`
  - [ ] Verify response shows status: `ok`
  - [ ] Check database connection status

## 🚀 Production Checklist (Azure)

- [ ] **Prepare for Production**
  - [ ] Create Azure SQL Database
  - [ ] Note connection string
  - [ ] Create strong password (min 12 chars, mixed case, numbers, symbols)
  - [ ] Configure firewall rules
  - [ ] Set up automated backups

- [ ] **Update .env.production**
  - [ ] Set `MSSQL_SERVER=your-server.database.windows.net`
  - [ ] Set `MSSQL_DATABASE=sqa_management`
  - [ ] Set `MSSQL_USERNAME=adminuser`
  - [ ] Set `MSSQL_PASSWORD=${AZURE_SQL_PASSWORD}` (use variable)
  - [ ] Update CORS origins for production domain
  - [ ] Update SECRET_KEY (generate new, strong key)
  - [ ] Set `DEBUG=false`

- [ ] **Security Hardening**
  - [ ] Enable HTTPS only
  - [ ] Configure SSL/TLS certificates
  - [ ] Set up firewall rules
  - [ ] Enable Azure AD authentication (optional but recommended)
  - [ ] Enable encryption at rest
  - [ ] Enable encryption in transit

## 📊 Verification Checklist

- [ ] **Database Schema Verification**
  ```sql
  -- Run these in SSMS
  SELECT name, type FROM sys.objects WHERE schema_id = SCHEMA_ID('dbo');
  ```
  Expected: 4 tables, 2 views, 1 stored procedure

- [ ] **Index Verification**
  ```sql
  SELECT name FROM sys.indexes WHERE object_id IN 
    (SELECT object_id FROM sys.tables WHERE name IN 
    ('users', 'user_sessions', 'agent_executions', 'documents'));
  ```
  Expected: Multiple indexes for each table

- [ ] **Constraint Verification**
  ```sql
  SELECT name FROM sys.key_constraints 
  WHERE type = 'PK' AND schema_id = SCHEMA_ID('dbo');
  ```
  Expected: Primary keys for all tables

## 📝 Final Checklist

- [ ] All documentation read and understood
- [ ] SQL Server installed and running
- [ ] SSMS installed and connected
- [ ] Database created
- [ ] Schema script executed
- [ ] Python packages installed
- [ ] .env file configured
- [ ] Application starts without errors
- [ ] Database connection verified
- [ ] (Optional) Data migrated from SQLite
- [ ] (Optional) Production environment configured

## 🎯 Success Criteria

✅ **Setup is complete when**:
- [ ] SSMS shows `sqa_management` database with 4 tables
- [ ] `python main.py` runs without database errors
- [ ] API health check returns `ok` status
- [ ] No connection warnings in application logs

## 📞 Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| Cannot connect to SQL Server | See DATABASE_SETUP.md "Troubleshooting" |
| ODBC driver not found | Install ODBC driver for SQL Server |
| Authentication failed | Check username/password in .env |
| Database not found | Run schema.sql first |
| Application won't start | Check database connection in logs |

## 📖 Reference Documents

- **DATABASE_SETUP.md** - Main setup guide with troubleshooting
- **SQL_SERVER_MIGRATION.md** - Migration overview and benefits
- **database/README.md** - Complete database documentation
- **FILES_CREATED.md** - List of all created files

---

**Checklist Version**: 1.0  
**Last Updated**: January 2, 2026  
**Status**: Ready for Implementation  
**Estimated Time**: 30-45 minutes
