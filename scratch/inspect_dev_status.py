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

# Get all fields for TRP-DEV-2026-0003
cur.execute("""
    SELECT *
    FROM testing.solicitudes_traspasos_v2
    WHERE folio = 'TRP-DEV-2026-0003';
""")
row = cur.fetchone()
print("TRP-DEV-2026-0003 row:")
if row:
    # Print column names and values
    colnames = [desc[0] for desc in cur.description]
    for col, val in zip(colnames, row):
        print(f"  {col}: {val}")
else:
    print("  Not found!")

cur.close()
conn.close()
