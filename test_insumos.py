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

try:
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    print("Conexion exitosa\n")

    # Column names of prof_insumos
    cur.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'testing'
          AND table_name = 'prof_insumos'
        ORDER BY ordinal_position;
    """)
    cols = cur.fetchall()
    print("--- Columnas prof_insumos ---")
    for c in cols:
        print(f"  {c[0]:30s}  {c[1]}")

    cur.close()
    conn.close()

except Exception as e:
    print(f"ERROR: {e}")
