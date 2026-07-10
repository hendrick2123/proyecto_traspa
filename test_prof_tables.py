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

    # ----- EMPRESAS -----
    cur.execute("SELECT DISTINCT id_empresa, nombre_empresa FROM testing.prof_empresas ORDER BY nombre_empresa;")
    rows = cur.fetchall()
    print(f"=== prof_empresas ({len(rows)} filas) ===")
    for r in rows[:5]:
        print(r)

    # ----- CENTROS DE COSTO -----
    cur.execute("SELECT DISTINCT id_cc, id_desarrollo, nombre_cc FROM testing.prof_centros_costo ORDER BY nombre_cc;")
    rows = cur.fetchall()
    print(f"\n=== prof_centros_costo ({len(rows)} filas) ===")
    for r in rows[:5]:
        print(r)

    # ----- DESARROLLOS -----
    cur.execute("SELECT DISTINCT id_desarrollo, descripcion_desarrollo FROM testing.prof_desarrollos ORDER BY descripcion_desarrollo;")
    rows = cur.fetchall()
    print(f"\n=== prof_desarrollos ({len(rows)} filas) ===")
    for r in rows[:5]:
        print(r)

    # ----- INSUMOS -----
    cur.execute("SELECT DISTINCT id_insumo, descripcion FROM testing.prof_insumos ORDER BY descripcion;")
    rows = cur.fetchall()
    print(f"\n=== prof_insumos ({len(rows)} filas) ===")
    for r in rows[:5]:
        print(r)

    cur.close()
    conn.close()
    print("\nListo.")

except Exception as e:
    print(f"ERROR: {e}")
