# SQL Server Setup Guide - SQA Management System

## 📋 Quick Start

You've successfully migrated from SQLite to SQL Server. Follow these steps to set up your database.

## 🔧 Step 1: Install SQL Server Components

### Option A: SQL Server Express (Local Development)

1. Download [SQL Server Express](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
2. Download [SQL Server Management Studio (SSMS)](https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms)
3. Install both with default settings

### Option B: Azure SQL Database (Production)

1. Create Azure SQL Database in Azure Portal
2. Note your server name: `your-server.database.windows.net`
3. Note your database name and credentials

## ✅ Step 2: Create Database

### Local SQL Server

1. Open **SQL Server Management Studio (SSMS)**
2. Connect to `localhost` or `(local)\SQLEXPRESS`
3. Right-click **Databases** → **New Database**
4. Name: `sqa_management`
5. Click **OK**

### Azure SQL

Skip this step - Azure automatically creates the database.

## 🏗️ Step 3: Run Schema Script

1. In SSMS, click **File** → **Open** → **File**
2. Select `database\schema.sql`
3. Click **Execute** (F5)
4. Wait for completion

## 📦 Step 4: Install Python Dependencies

```bash
cd backend

# Install required packages
pip install pyodbc
pip install aioodbc  # For async support

# Or install all at once
pip install -r requirements.txt
```

## 🔐 Step 5: Configure Environment

### Update `.env` file

```env
# Database Settings
DATABASE_TYPE=sqlserver
MSSQL_SERVER=localhost                    # or your-server.database.windows.net
MSSQL_DATABASE=sqa_management
MSSQL_USERNAME=sa                         # or your username
MSSQL_PASSWORD=YourPassword123
MSSQL_DRIVER=ODBC Driver 17 for SQL Server
```

## 🔄 Step 6: Migrate Data (Optional)

If you have existing SQLite data:

```bash
cd database

# Run migration script
python migrate_sqlite_to_sqlserver.py

# This generates insert files:
# - users_insert.sql
# - user_sessions_insert.sql
# - agent_executions_insert.sql
# - documents_insert.sql
```

Then execute these files in SSMS in order.

## 🚀 Step 7: Run Application

```bash
cd backend
python main.py
```

You should see:
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## 📝 Requirements.txt Updates

Update `backend/requirements.txt`:

```
# Remove or comment out:
# aiosqlite>=0.19.0

# Keep or add:
sqlalchemy>=2.0.0
aioodbc>=0.5.0      # For SQL Server async
pyodbc>=5.0.0       # ODBC driver
```

## ✅ Verification

### Check Database Creation

```sql
-- Run in SSMS
SELECT name FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo');
```

Expected output:
```
documents
agent_executions
user_sessions
users
```

### Test Connection from Python

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

## 🐳 Docker Setup (Optional)

Run SQL Server in Docker:

```bash
docker run -e "ACCEPT_EULA=Y" \
  -e "MSSQL_SA_PASSWORD=YourPassword123" \
  -p 1433:1433 \
  --name sqlserver \
  -d mcr.microsoft.com/mssql/server:2022-latest
```

Then update `.env`:
```env
MSSQL_SERVER=localhost:1433
MSSQL_USERNAME=sa
MSSQL_PASSWORD=YourPassword123
```

## 🆘 Troubleshooting

### Connection Error: "Cannot connect to server"

- ✓ Check SQL Server is running
- ✓ Verify server name is correct
- ✓ Check username/password
- ✓ Verify ODBC driver installed: `sqlcmd -?`

### "Cannot find ODBC Driver"

Install ODBC driver:
- Windows: [Microsoft ODBC Driver](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server)
- macOS: `brew install unixodbc`
- Linux: `sudo apt install odbc-mssql`

### "Login failed for user"

- ✓ Check username in `.env`
- ✓ Check password is correct
- ✓ For Azure SQL: check if user has access

### "Database does not exist"

- ✓ Create database first (see Step 2)
- ✓ Check database name in `.env` matches

### "Permission denied"

For Azure SQL:
- ✓ Check firewall rules allow your IP
- ✓ Add your IP in Azure Portal → Firewalls and virtual networks

## 📊 Useful Commands

### Check SQL Server Version

```sql
SELECT @@VERSION;
```

### List All Users

```sql
SELECT email, full_name, is_active FROM dbo.users;
```

### View Database Size

```sql
SELECT 
    name,
    CAST(size * 8 / 1024.0 as decimal(10,2)) as [Size (MB)]
FROM sys.master_files
WHERE database_id = DB_ID('sqa_management');
```

### Monitor Connections

```sql
SELECT * FROM sys.dm_exec_sessions
WHERE database_id = DB_ID('sqa_management');
```

## 📚 Additional Resources

- [SQL Server T-SQL Reference](https://learn.microsoft.com/en-us/sql/t-sql/language-reference)
- [SQLAlchemy MSSQL Dialect](https://docs.sqlalchemy.org/en/20/dialects/mssql/)
- [pyodbc Documentation](https://github.com/mkleehammer/pyodbc/wiki)
- [Azure SQL Database](https://learn.microsoft.com/en-us/azure/azure-sql/)

---

**Status**: ✅ Ready to Use  
**Database**: SQL Server  
**Configuration**: Located in `database/` folder  
**Setup Date**: January 2, 2026
