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
    print("Connecting to database...")
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # Truncate tables with CASCADE and restart identity
    print("Truncating testing.detalle_traspaso_insumos_v2 and testing.solicitudes_traspasos_v2...")
    cur.execute("TRUNCATE TABLE testing.detalle_traspaso_insumos_v2 RESTART IDENTITY CASCADE;")
    cur.execute("TRUNCATE TABLE testing.solicitudes_traspasos_v2 RESTART IDENTITY CASCADE;")
    
    conn.commit()
    print("Cleanup successful! Database is now clean of test traspaso records.")

    cur.close()
    conn.close()

except Exception as e:
    print(f"Error executing cleanup: {e}")
