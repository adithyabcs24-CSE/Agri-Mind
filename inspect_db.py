#!/usr/bin/env python3
import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect

# Load environment variables
backend_env = os.path.join(os.path.dirname(__file__), "backend", ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env)
else:
    load_dotenv()

# Use sync URL for easy synchronous script execution
db_url = os.getenv("DATABASE_URL_SYNC")
if not db_url:
    # Try parsing DATABASE_URL
    async_url = os.getenv("DATABASE_URL")
    if async_url:
        db_url = async_url.replace("postgresql+asyncpg://", "postgresql://")
    else:
        db_url = "postgresql://agrimind:agrimind123@localhost:5432/agrimind_db"

print(f"Connecting to database: {db_url.split('@')[-1]}...")

try:
    # Try importing pandas for beautiful tabulate printing
    import pandas as pd
    has_pandas = True
except ImportError:
    has_pandas = False

try:
    engine = create_engine(db_url)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    if not tables:
        print("\nConnection successful, but no tables found in the database.")
        print("Please ensure you have run the migrations: `alembic upgrade head` inside the backend directory.")
        sys.exit(0)

    print("\n" + "=" * 50)
    print(f" DATABASE CONNECTED: Found {len(tables)} tables")
    print("=" * 50)

    for table in tables:
        print(f"\n📁 Table: {table}")
        print("-" * len(f"Table: {table}") + "--")
        
        try:
            with engine.connect() as conn:
                if has_pandas:
                    df = pd.read_sql_query(f"SELECT * FROM {table} LIMIT 20", conn)
                    if df.empty:
                        print(" (0 rows)")
                    else:
                        print(df.to_string(index=False))
                else:
                    # Fallback to standard dict cursor printing if pandas isn't in venv
                    from sqlalchemy import text
                    result = conn.execute(text(f"SELECT * FROM {table} LIMIT 20"))
                    keys = result.keys()
                    rows = result.fetchall()
                    if not rows:
                        print(" (0 rows)")
                    else:
                        print(" | ".join(keys))
                        print("-" * 50)
                        for r in rows:
                            print(" | ".join(str(val) for val in r))
        except Exception as query_err:
            print(f"  ⚠️ Error reading table: {query_err}")
            
    print("\n" + "=" * 50 + "\n")

except Exception as conn_err:
    print(f"\n❌ Error connecting to database: {conn_err}")
    print("\nTroubleshooting tips:")
    print("1. Ensure your Docker container is running: `docker compose up -d db`")
    print("2. Verify that Docker Desktop daemon is active on your Mac.")
    print("3. Check if your connection parameters in `backend/.env` are correct.")
