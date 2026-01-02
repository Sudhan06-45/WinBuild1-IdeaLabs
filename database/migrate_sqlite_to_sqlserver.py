"""
SQLite to SQL Server Migration Script
Converts data from SQLite (sqa_dev.db) to SQL Server
"""

import sqlite3
import json
from datetime import datetime
import logging
from typing import List, Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SQLiteMigrator:
    """Handles migration from SQLite to SQL Server"""
    
    def __init__(self, sqlite_db_path: str = "./sqa_dev.db"):
        """Initialize migrator with SQLite database path"""
        self.sqlite_db_path = sqlite_db_path
        self.connection = None
        
    def connect(self):
        """Connect to SQLite database"""
        try:
            self.connection = sqlite3.connect(self.sqlite_db_path)
            self.connection.row_factory = sqlite3.Row
            logger.info(f"✓ Connected to SQLite: {self.sqlite_db_path}")
        except Exception as e:
            logger.error(f"✗ Failed to connect to SQLite: {e}")
            raise
    
    def close(self):
        """Close SQLite connection"""
        if self.connection:
            self.connection.close()
            logger.info("✓ SQLite connection closed")
    
    def get_table_data(self, table_name: str) -> List[Dict[str, Any]]:
        """Fetch all data from a table"""
        try:
            cursor = self.connection.cursor()
            cursor.execute(f"SELECT * FROM {table_name}")
            columns = [description[0] for description in cursor.description]
            data = []
            for row in cursor.fetchall():
                data.append(dict(zip(columns, row)))
            logger.info(f"✓ Fetched {len(data)} records from {table_name}")
            return data
        except Exception as e:
            logger.error(f"✗ Error fetching data from {table_name}: {e}")
            return []
    
    def convert_data(self):
        """Convert and export data in SQL Server format"""
        self.connect()
        
        try:
            # Export data from all tables
            tables_to_export = ['users', 'user_sessions', 'agent_executions', 'documents']
            exported_data = {}
            
            for table in tables_to_export:
                logger.info(f"\n📋 Processing table: {table}")
                data = self.get_table_data(table)
                exported_data[table] = data
                
                if data:
                    self._generate_insert_statements(table, data)
            
            logger.info("\n✓ Migration data prepared successfully")
            return exported_data
            
        finally:
            self.close()
    
    def _generate_insert_statements(self, table_name: str, data: List[Dict[str, Any]]):
        """Generate SQL Server INSERT statements"""
        if not data:
            logger.warning(f"No data to migrate for table: {table_name}")
            return
        
        output_file = f"{table_name}_insert.sql"
        
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(f"-- Insert statements for {table_name}\n")
                f.write(f"-- Generated: {datetime.now().isoformat()}\n\n")
                
                for record in data:
                    columns = list(record.keys())
                    values = list(record.values())
                    
                    # Build INSERT statement
                    columns_str = ", ".join([f"[{col}]" for col in columns])
                    values_str = ", ".join([self._format_value(v) for v in values])
                    
                    insert_stmt = f"INSERT INTO dbo.{table_name} ({columns_str}) VALUES ({values_str});\n"
                    f.write(insert_stmt)
                
                f.write(f"\n-- Total records inserted: {len(data)}\n")
            
            logger.info(f"✓ Generated {output_file} with {len(data)} INSERT statements")
        
        except Exception as e:
            logger.error(f"✗ Error generating INSERT statements for {table_name}: {e}")
    
    @staticmethod
    def _format_value(value: Any) -> str:
        """Format Python value to SQL Server value"""
        if value is None:
            return "NULL"
        elif isinstance(value, bool):
            return "1" if value else "0"
        elif isinstance(value, (int, float)):
            return str(value)
        elif isinstance(value, dict) or isinstance(value, list):
            # Convert JSON objects to JSON string
            return f"'{json.dumps(value).replace(chr(39), chr(39)+chr(39))}'"
        else:
            # Escape single quotes
            escaped = str(value).replace("'", "''")
            return f"'{escaped}'"


def main():
    """Main migration function"""
    print("=" * 70)
    print("SQLite to SQL Server Migration Tool")
    print("=" * 70)
    print()
    
    migrator = SQLiteMigrator("./sqa_dev.db")
    
    try:
        logger.info("Starting migration process...")
        data = migrator.convert_data()
        
        # Summary
        print("\n" + "=" * 70)
        print("MIGRATION SUMMARY")
        print("=" * 70)
        for table, records in data.items():
            print(f"{table:25} : {len(records):>5} records")
        
        print("\n✓ Migration completed successfully!")
        print("Generated SQL files:")
        print("  - users_insert.sql")
        print("  - user_sessions_insert.sql")
        print("  - agent_executions_insert.sql")
        print("  - documents_insert.sql")
        print("\nNext steps:")
        print("1. Ensure database exists in SQL Server")
        print("2. Run schema.sql to create tables")
        print("3. Run the generated INSERT SQL files in order")
        print("=" * 70)
        
    except Exception as e:
        logger.error(f"✗ Migration failed: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
