"""
Azure SQL Connection Diagnostics
Helps identify why the connection is failing
"""

import os
import socket
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("\n" + "="*70)
print("🔍 AZURE SQL CONNECTION DIAGNOSTICS")
print("="*70)

# 1. Check environment variables
print("\n1️⃣  CHECKING ENVIRONMENT VARIABLES:")
print("-" * 70)

AZURE_SQL_SERVER = os.getenv("AZURE_SQL_SERVER")
AZURE_SQL_DATABASE = os.getenv("AZURE_SQL_DATABASE")
AZURE_SQL_USERNAME = os.getenv("AZURE_SQL_USERNAME")
AZURE_SQL_PASSWORD = os.getenv("AZURE_SQL_PASSWORD")
AZURE_SQL_DRIVER = os.getenv("AZURE_SQL_DRIVER")

print(f"✓ AZURE_SQL_SERVER:   {AZURE_SQL_SERVER}")
print(f"✓ AZURE_SQL_DATABASE: {AZURE_SQL_DATABASE}")
print(f"✓ AZURE_SQL_USERNAME: {AZURE_SQL_USERNAME}")
print(f"✓ AZURE_SQL_PASSWORD: {'*' * len(AZURE_SQL_PASSWORD) if AZURE_SQL_PASSWORD else 'NOT SET'}")
print(f"✓ AZURE_SQL_DRIVER:   {AZURE_SQL_DRIVER}")

# 2. Construct connection string
print("\n2️⃣  CONNECTION STRING CONSTRUCTION:")
print("-" * 70)

driver = AZURE_SQL_DRIVER.replace(' ', '+') if AZURE_SQL_DRIVER else "ODBC+Driver+17+for+SQL+Server"
connection_string = (
    f"mssql+aioodbc://{AZURE_SQL_USERNAME}:{AZURE_SQL_PASSWORD}"
    f"@{AZURE_SQL_SERVER}/{AZURE_SQL_DATABASE}"
    f"?driver={driver}"
    f"&Encrypt=yes&TrustServerCertificate=no"
)
print(f"Connection String:\n{connection_string}\n")

# 3. Test network connectivity
print("\n3️⃣  TESTING NETWORK CONNECTIVITY:")
print("-" * 70)

if AZURE_SQL_SERVER:
    server_name = AZURE_SQL_SERVER.split(':')[0] if ':' in AZURE_SQL_SERVER else AZURE_SQL_SERVER
    
    try:
        print(f"Attempting to resolve hostname: {server_name}")
        ip_address = socket.gethostbyname(server_name)
        print(f"✅ Hostname resolved successfully: {server_name} → {ip_address}")
    except socket.gaierror as e:
        print(f"❌ FAILED TO RESOLVE HOSTNAME: {e}")
        print("   This means Azure SQL server cannot be found or DNS is not working")
    except Exception as e:
        print(f"❌ Network error: {e}")

    # Test port 1433 connectivity
    print(f"\nAttempting to connect to port 1433 (SQL Server)...")
    try:
        sock = socket.create_connection((AZURE_SQL_SERVER, 1433), timeout=5)
        sock.close()
        print(f"✅ Port 1433 is OPEN and accessible")
    except socket.timeout:
        print(f"❌ CONNECTION TIMEOUT to port 1433")
        print("   This usually means firewall is blocking the connection")
    except socket.error as e:
        print(f"❌ CANNOT REACH port 1433: {e}")
        print("   Possible causes:")
        print("   - Azure SQL firewall rules are blocking your IP")
        print("   - Server is not running or not accessible")
        print("   - Network connectivity issues")

# 4. Check local IP
print("\n4️⃣  YOUR COMPUTER'S IP ADDRESS:")
print("-" * 70)

try:
    # Get local IP
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    print(f"Local hostname: {hostname}")
    print(f"Local IP address: {local_ip}")
    print("\n⚠️  You need to add this IP to Azure SQL Server firewall rules:")
    print(f"   IP: {local_ip}")
except Exception as e:
    print(f"Could not determine local IP: {e}")

# 5. Check ODBC Driver
print("\n5️⃣  CHECKING ODBC DRIVER:")
print("-" * 70)

try:
    import pyodbc
    print("✅ pyodbc is installed")
    print(f"Version: {pyodbc.version}")
    
    # List available ODBC drivers
    drivers = pyodbc.drivers()
    print(f"\nAvailable ODBC Drivers ({len(drivers)}):")
    for driver in drivers:
        print(f"  - {driver}")
    
    # Check for SQL Server driver
    sql_drivers = [d for d in drivers if "SQL Server" in d]
    if sql_drivers:
        print(f"\n✅ Found SQL Server ODBC Driver: {sql_drivers[0]}")
    else:
        print(f"\n❌ SQL Server ODBC Driver NOT found!")
        print("   Install: https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server")
        
except ImportError:
    print("❌ pyodbc is NOT installed")
    print("   Run: pip install pyodbc")

# 6. Summary and recommendations
print("\n" + "="*70)
print("📋 SUMMARY & RECOMMENDATIONS:")
print("="*70)

print("""
If you see "CONNECTION TIMEOUT" or "CANNOT REACH port 1433":
   👉 YOUR IP IS BLOCKED BY AZURE SQL FIREWALL

Solution:
   1. Go to Azure Portal: https://portal.azure.com
   2. Find SQL Server: sqaidealabs
   3. Go to: Networking → Firewall rules
   4. Add your IP (shown above) OR allow "All Azure services and resources"
   5. Click "Add client IP" button - it auto-fills your IP
   6. Save and wait 2-3 minutes
   7. Run this script again or restart the backend

Alternative (Allow All Azure Services):
   1. Azure Portal → SQL Server sqaidealabs
   2. Networking → Firewall rules
   3. Toggle "Allow Azure services and resources" to ON
   4. Save

If you see "CANNOT RESOLVE HOSTNAME":
   ✓ Check if Azure SQL Server exists
   ✓ Verify server name: sqaidealabs.database.windows.net
   ✓ Check internet connection

If ODBC Driver is missing:
   ✓ Download: https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server
   ✓ Install ODBC Driver 17 for SQL Server
   ✓ Restart Python/backend after installation
""")

print("="*70)
