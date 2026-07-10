import psycopg2

# Cargar DB_CONFIG de forma segura desde db_config.py
import sys
import os
# Agregar directorios para buscar db_config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from db_config import DB_CONFIG
except ImportError:
    DB_CONFIG = {}

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()

# Get check constraints on solicitudes_traspasos_v2
cur.execute("""
    SELECT conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    JOIN pg_class cl ON cl.oid = c.conrelid
    WHERE n.nspname = 'testing' AND cl.relname = 'solicitudes_traspasos_v2';
""")
print("Constraints on solicitudes_traspasos_v2:")
for name, definition in cur.fetchall():
    print(f"  {name}: {definition}")

# Check columns and types
cur.execute("""
    SELECT column_name, data_type, character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = 'testing' AND table_name = 'solicitudes_traspasos_v2';
""")
print("\nColumns:")
for col, dtype, maxlen in cur.fetchall():
    print(f"  {col} ({dtype}, {maxlen})")

cur.close()
conn.close()
