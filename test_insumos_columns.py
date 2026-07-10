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

tablas = [
    "prof_empresas",
    "prof_centros_costo",
    "prof_desarrollos",
    "prof_insumos",
]

conn = psycopg2.connect(**DB_CONFIG)
print("Conexion exitosa\n")

for tabla in tablas:
    try:
        cur = conn.cursor()
        # Query columns directly from pg_attribute/pg_class to bypass some restrictions,
        # or use information_schema
        cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'testing' AND table_name = '{tabla}' ORDER BY ordinal_position;")
        cols = cur.fetchall()
        print(f"--- {tabla} ---")
        if cols:
            for c in cols:
                print(f"  {c[0]:30s}  {c[1]}")
        else:
            print("  (no columns found in information_schema)")
        
        # Try counting rows
        cur.execute(f"SELECT COUNT(*) FROM testing.{tabla};")
        cnt = cur.fetchone()[0]
        print(f"  TOTAL ROWS: {cnt}")
        
        # Fetch one row to see sample data
        cur.execute(f"SELECT * FROM testing.{tabla} LIMIT 1;")
        row = cur.fetchone()
        print(f"  SAMPLE ROW: {row}")
        
        cur.close()
        conn.commit()
    except Exception as e:
        print(f"  Error on {tabla}: {e}")
        conn.rollback()
    print()

conn.close()
