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

    cur.execute('SELECT COUNT(*) FROM testing."Solicitud_traspasos";')
    print(f"Solicitud_traspasos count: {cur.fetchone()[0]}")

    cur.execute('SELECT COUNT(*) FROM testing."Detalle_traspaso_insumos";')
    print(f"Detalle_traspaso_insumos count: {cur.fetchone()[0]}")

    cur.close()
    conn.close()

except Exception as e:
    print(f"ERROR: {e}")
