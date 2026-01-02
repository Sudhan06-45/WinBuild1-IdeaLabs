# 🚀 Quick Reference Card - SQL Server Setup

## ⚡ 30-Second Summary

You've been migrated from **SQLite** to **SQL Server**. Three things to do:

1. **Read**: `DATABASE_SETUP.md`
2. **Install**: SQL Server & SSMS
3. **Run**: `python main.py`

---

## 📋 Files Created

### Database (4 files)
```
database/
├── schema.sql                    ← Execute in SSMS
├── migration.sql                 ← Reference
├── migrate_sqlite_to_sqlserver.py ← Python tool
└── README.md                     ← Technical guide
```

### Documentation (9 files)
```
DATABASE_SETUP.md                 ← ⭐ START HERE
DOCUMENTATION_INDEX.md            ← Find docs here
IMPLEMENTATION_CHECKLIST.md       ← Follow steps
README_MIGRATION.md               ← Overview
VISUAL_OVERVIEW.md                ← Diagrams
FILES_CREATED.md                  ← Inventory
SQL_SERVER_MIGRATION.md           ← Benefits
COMPLETION_SUMMARY.md             ← Final summary
QUICK_REFERENCE.md                ← This file
```

### Configuration (3 files)
```
backend/.env                      ← Local config
backend/.env.production           ← Azure config
backend/.env.example              ← Template
```

---

## 🚀 Quick Start Commands

### 1. Create Database
```sql
CREATE DATABASE sqa_management;
```

### 2. Execute Schema (in SSMS)
```
File → Open → database/schema.sql
Press F5 or Click Execute
```

### 3. Update Configuration
```env
# Edit backend/.env
MSSQL_SERVER=localhost
MSSQL_DATABASE=sqa_management
MSSQL_USERNAME=sa
MSSQL_PASSWORD=YourPassword123
```

### 4. Install Dependencies
```bash
pip install pyodbc aioodbc
```

### 5. Run Application
```bash
cd backend
python main.py
```

---

## 📖 Documentation Map

| Need | File |
|------|------|
| How to setup? | `DATABASE_SETUP.md` |
| Step by step? | `IMPLEMENTATION_CHECKLIST.md` |
| Find docs? | `DOCUMENTATION_INDEX.md` |
| See architecture? | `VISUAL_OVERVIEW.md` |
| What was created? | `FILES_CREATED.md` |
| Technical details? | `database/README.md` |
| SQL schema? | `database/schema.sql` |
| Migrate data? | `database/migrate_sqlite_to_sqlserver.py` |

---

## ⚙️ .env Configuration

### Local Development
```env
DATABASE_TYPE=sqlserver
MSSQL_SERVER=localhost
MSSQL_DATABASE=sqa_management
MSSQL_USERNAME=sa
MSSQL_PASSWORD=YourPassword123
MSSQL_DRIVER=ODBC Driver 17 for SQL Server
```

### Azure Production
```env
DATABASE_TYPE=sqlserver
MSSQL_SERVER=your-server.database.windows.net
MSSQL_DATABASE=sqa_management
MSSQL_USERNAME=adminuser
MSSQL_PASSWORD=YourPassword123
MSSQL_DRIVER=ODBC Driver 17 for SQL Server
```

---

## 🔍 Verify Setup

```sql
-- Check tables created
SELECT name FROM sys.tables;

-- Check records
SELECT COUNT(*) FROM dbo.users;
SELECT COUNT(*) FROM dbo.user_sessions;
SELECT COUNT(*) FROM dbo.agent_executions;
SELECT COUNT(*) FROM dbo.documents;
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Cannot connect | Check .env credentials |
| ODBC not found | Install ODBC driver |
| Database not found | Run schema.sql first |
| Permission denied | Check username/password |
| Port already in use | Change MSSQL_SERVER port |

See `DATABASE_SETUP.md` for detailed troubleshooting.

---

## 📊 Database Tables

1. **users** - User accounts
2. **user_sessions** - Auth tokens
3. **agent_executions** - Agent runs
4. **documents** - Generated reports

All with indexes, constraints, and relationships.

---

## 🔐 Security Checklist

- [ ] Changed default SQL Server password
- [ ] Updated SECRET_KEY in .env
- [ ] Added .env to .gitignore
- [ ] Configured CORS origins
- [ ] For Azure: Set firewall rules

---

## 📱 Installation Options

### Local (Free)
- SQL Server Express
- SSMS
- No cloud costs

### Azure (Managed)
- Azure SQL Database
- Automatic backups
- High availability

---

## ⏱️ Setup Timeline

| Step | Time |
|------|------|
| Read docs | 5 min |
| Install SQL Server | 10 min |
| Create database | 5 min |
| Run schema.sql | 2 min |
| Update .env | 3 min |
| Test connection | 5 min |
| **Total** | **30 min** |

---

## 🎯 Success Criteria

✅ SSMS shows sqa_management database  
✅ 4 tables visible in SSMS  
✅ Python connection works  
✅ Application starts without errors  

---

## 🔗 Important Links

- SQL Server: https://www.microsoft.com/sql-server/sql-server-downloads
- SSMS: https://learn.microsoft.com/sql/ssms/download-sql-server-management-studio-ssms
- Azure SQL: https://portal.azure.com
- SQLAlchemy: https://docs.sqlalchemy.org/

---

## 📝 File Sizes (Approx)

| File | Size |
|------|------|
| schema.sql | 12 KB |
| migration.sql | 3 KB |
| migrate_sqlite_to_sqlserver.py | 8 KB |
| DATABASE_SETUP.md | 18 KB |
| Total documentation | ~90 KB |

---

## 🎊 What's Included

✅ Complete schema  
✅ Migration tools  
✅ Configuration templates  
✅ Setup documentation  
✅ Implementation checklist  
✅ Technical reference  
✅ Troubleshooting guide  
✅ Architecture diagrams  

---

## 🚀 Next Action

**👉 Open: `DATABASE_SETUP.md` and follow the steps**

---

**Created**: January 2, 2026  
**Status**: ✅ Ready to Use  
**Estimated Setup Time**: 30 minutes
