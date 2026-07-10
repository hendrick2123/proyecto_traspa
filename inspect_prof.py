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

try:
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    print("Conexion exitosa\n")

    for tabla in tablas:
        # Columnas
        cur.execute("""
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'testing'
              AND table_name = %s
            ORDER BY ordinal_position;
        """, (tabla,))
        cols = cur.fetchall()
        print(f"--- {tabla} ---")
        if cols:
            for c in cols:
                print(f"  {c[0]:30s}  {c[1]}")
        else:
            print("  (tabla no encontrada o sin columnas)")

        # Conteo de filas
        try:
            cur.execute(f"SELECT COUNT(*) FROM testing.{tabla};")
            count = cur.fetchone()[0]
            print(f"  TOTAL FILAS: {count}")
        except Exception as e:
            print(f"  Error al contar filas: {e}")
        print()

    cur.close()
    conn.close()

except Exception as e:
    print(f"ERROR: {e}")
