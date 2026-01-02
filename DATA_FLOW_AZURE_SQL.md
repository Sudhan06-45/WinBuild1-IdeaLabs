# 📊 Data Flow: Signup to Azure SQL Database

## Complete Data Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                 USER SIGNUP FLOW                                │
└─────────────────────────────────────────────────────────────────┘

Step 1: Frontend (React)
┌────────────────────────┐
│  Signup.tsx            │
│  ├─ Full Name         │
│  ├─ Email             │
│  ├─ Password          │
│  └─ Confirm Password  │
└────────────────┬───────┘
                 │ Validates form
                 ▼
Step 2: API Call
┌────────────────────────┐
│  POST /api/auth/signup │
│  authApi.signup()      │
└────────────────┬───────┘
                 │ Sends JSON data
                 │ {
                 │   "email": "user@company.com",
                 │   "password": "SecurePass123",
                 │   "full_name": "John Doe"
                 │ }
                 ▼
Step 3: Backend (FastAPI)
┌────────────────────────────────┐
│  backend/api/auth.py           │
│  @router.post("/signup")       │
│                                │
│  1. Validate email unique      │
│  2. Hash password              │
│  3. Create User object         │
│  4. Save to database           │
│  5. Create session/token       │
│  6. Return access token        │
└────────────────┬───────────────┘
                 │
                 ▼
Step 4: Database Layer
┌────────────────────────────────┐
│  database/models.py            │
│  User model                    │
│  ├─ id (auto-increment)        │
│  ├─ uuid (unique identifier)   │
│  ├─ email                      │
│  ├─ password_hash              │
│  ├─ full_name                  │
│  ├─ is_active (default: True)  │
│  ├─ is_admin (default: False)  │
│  └─ created_at (timestamp)     │
└────────────────┬───────────────┘
                 │
                 ▼
Step 5: Connection Configuration
┌────────────────────────────────────────┐
│  database/connection.py                │
│  get_database_url()                    │
│                                        │
│  Reads from .env:                      │
│  ├─ AZURE_SQL_SERVER                  │
│  ├─ AZURE_SQL_DATABASE                │
│  ├─ AZURE_SQL_USERNAME                │
│  ├─ AZURE_SQL_PASSWORD                │
│  └─ AZURE_SQL_DRIVER                  │
└────────────────┬───────────────────────┘
                 │
                 ▼ Creates connection string
        mssql+aioodbc://sqaadmin:admin@123
        @sqaidealabs.database.windows.net/idealabs
                 │
                 ▼
Step 6: Azure SQL Database
┌─────────────────────────────────────────┐
│  Azure SQL: sqaidealabs                 │
│  Database: idealabs                     │
│                                         │
│  Table: dbo.users                       │
│  ├─ Stores your signup data             │
│  ├─ Encrypted connection (TLS)          │
│  ├─ Encrypted data at rest              │
│  └─ Automatic backups                   │
└─────────────────────────────────────────┘
                 │
                 ▼
Step 7: Response to Frontend
┌──────────────────────────────┐
│  auth/signup response        │
│  {                           │
│    "access_token": "...",    │
│    "expires_in": 86400,      │
│    "user": {                 │
│      "id": 1,               │
│      "uuid": "uuid-here",   │
│      "email": "user@...",   │
│      "full_name": "John"    │
│    }                         │
│  }                           │
└──────────────────────────────┘
                 │
                 ▼
Step 8: Frontend Storage
┌──────────────────────────────┐
│  authStore (Zustand)         │
│  Store user data in state    │
│  & token in localStorage     │
│  Redirect to /dashboard      │
└──────────────────────────────┘
```

## 🔄 Data Path Summary

**Frontend Form** → **API Endpoint** → **Business Logic** → **Database Model** → **Azure SQL DB**

1. ✅ User enters data in `Signup.tsx`
2. ✅ Form validation happens in React
3. ✅ Data sent to `POST /api/auth/signup`
4. ✅ Backend validates data again
5. ✅ Password is hashed with bcrypt
6. ✅ User object is created
7. ✅ Saved to database using SQLAlchemy ORM
8. ✅ Data inserted into Azure SQL table `dbo.users`
9. ✅ Response sent back with token
10. ✅ Frontend logs user in

## 🗄️ Azure SQL Storage Details

### Your Database
- **Server**: `sqaidealabs.database.windows.net`
- **Database**: `idealabs`
- **Table**: `dbo.users`

### User Record Created
```sql
INSERT INTO dbo.users 
(uuid, email, password_hash, full_name, is_active, is_admin, created_at)
VALUES
('550e8400-e29b-41d4-a716-446655440000', 'user@company.com', '$2b$12$...', 'John Doe', 1, 0, '2025-01-02T10:30:00')
```

## 🔐 Security Flow

```
User Password: "SecurePass123"
        │
        ▼
    bcrypt hashing
        │
        ▼
Password Hash: "$2b$12$N9qo8uLO..."  ← Only this is stored
        │
        ▼
Encrypted transmission to Azure (TLS)
        │
        ▼
Encrypted at rest in Azure SQL
        │
        ▼
Never transmitted back to frontend ✅
```

## 📋 Configuration Check

Your `.env` file is now configured for Azure SQL:

```env
AZURE_SQL_SERVER=sqaidealabs.database.windows.net
AZURE_SQL_DATABASE=idealabs
AZURE_SQL_USERNAME=sqaadmin
AZURE_SQL_PASSWORD=admin@123
AZURE_SQL_DRIVER=ODBC Driver 17 for SQL Server
```

This tells the application:
- 🖥️ Connect to: `sqaidealabs.database.windows.net`
- 📦 Use database: `idealabs`
- 👤 Login as: `sqaadmin`
- 🔐 With password: `admin@123`
- 🔗 Using ODBC Driver 17

## ✅ Verification Steps

### 1. Check if Data is Actually Being Saved

After clicking "Create Account":

**Method A: Using Azure Portal**
1. Go to https://portal.azure.com
2. Find your SQL Server: `sqaidealabs`
3. Open Query Editor
4. Run:
```sql
SELECT TOP 10 email, full_name, created_at FROM dbo.users
ORDER BY created_at DESC
```

**Method B: Using SQL Server Management Studio (SSMS)**
1. Connect to: `sqaidealabs.database.windows.net`
2. Login as: `sqaadmin` / `admin@123`
3. Navigate to: `idealabs` → Tables → `dbo.users`
4. Right-click → Select Top 1000 Rows
5. See your signup data!

### 2. Check Application Logs

Run backend with debug enabled:
```bash
cd backend
python main.py
```

Look for:
```
☁️ Using Azure SQL database (production)
✅ Database connection established
```

### 3. Check Frontend Local Storage

After signup, in browser DevTools:
1. Press F12
2. Go to Application → Local Storage
3. You should see:
   - `auth-token` (your JWT token)
   - `auth-user` (your user data)

## 🔍 Troubleshooting

### Issue: User data not appearing in Azure SQL

**Check 1: Verify Connection**
```bash
cd backend
python test_connection.py  # If you have this script
```

**Check 2: Verify .env Variables**
Make sure `.env` has:
```env
AZURE_SQL_SERVER=sqaidealabs.database.windows.net
AZURE_SQL_DATABASE=idealabs
AZURE_SQL_USERNAME=sqaadmin
AZURE_SQL_PASSWORD=admin@123
```

**Check 3: Verify Tables Exist**
In Azure Portal Query Editor:
```sql
SELECT * FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'dbo'
```

Should show: `users`, `user_sessions`, `agent_executions`, `documents`

**Check 4: Check Firewall Rules**
Azure SQL might be blocking your connection:
1. Go to Azure Portal
2. Find SQL Server: `sqaidealabs`
3. Go to Networking → Firewall Rules
4. Add your IP address
5. Try again

### Issue: Connection timeout

**Solution:**
1. Verify Azure SQL is running (not paused)
2. Check firewall rules allow your IP
3. Verify credentials are correct
4. Check network connectivity

## 📈 Data Flow Diagram (Detailed)

```
FRONTEND                    BACKEND                     DATABASE
─────────────────────────────────────────────────────────────────

User fills form
in Signup.tsx
        │
        ▼
React validates
(password strength,
 email format)
        │
        ▼
authApi.signup()
submits POST request
        │
        │ JSON:
        │ {
        │   "email": "...",
        │   "password": "...",
        │   "full_name": "..."
        │ }
        │
        ├──────────────────► FastAPI endpoint
        │                   /api/auth/signup
        │                   │
        │                   ▼
        │                   Pydantic validation
        │                   (SignupRequest model)
        │                   │
        │                   ▼
        │                   Business logic:
        │                   1. Check email exists
        │                   │
        │                   ├──────────────────► Query users table
        │                   │                   SELECT * FROM dbo.users
        │                   │◄──────────────────
        │                   │
        │                   2. Hash password
        │                   │   (bcrypt)
        │                   │
        │                   3. Create User model
        │                   │   (SQLAlchemy ORM)
        │                   │
        │                   ├──────────────────► INSERT INTO dbo.users
        │                   │                   (uuid, email, password_hash,
        │                   │                    full_name, is_active,
        │                   │                    is_admin, created_at)
        │                   │◄──────────────────
        │                   │
        │                   4. Create session
        │                   │
        │                   ├──────────────────► INSERT INTO dbo.user_sessions
        │                   │                   (user_id, token, expires_at)
        │                   │◄──────────────────
        │                   │
        │                   5. Create JWT token
        │                   │
        │                   6. Return response
        │◄──────────────────
        │
        ▼
Store in localStorage
(token + user data)
        │
        ▼
Update auth state
(Zustand store)
        │
        ▼
Redirect to
/dashboard
```

## 🎯 Summary

**Your signup data flow:**

1. **Frontend** → User fills form, clicks "Create Account"
2. **API Call** → Data sent to `POST /api/auth/signup`
3. **Validation** → Email & password checked
4. **Security** → Password hashed with bcrypt
5. **Database Insert** → User data saved to Azure SQL
6. **Session Creation** → JWT token generated
7. **Response** → Token sent to frontend
8. **Authentication** → User logged in automatically

**Data Location**: Azure SQL Database `idealabs` → Table `dbo.users`

---

**Configuration**: ✅ Already set up for Azure SQL  
**Data Destination**: ✅ Azure SQL (sqaidealabs.database.windows.net)  
**Status**: ✅ Ready to use
