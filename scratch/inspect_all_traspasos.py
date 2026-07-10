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

# Get all fields for testing.solicitudes_traspasos_v2
cur.execute("""
    SELECT id_solicitud, folio, tipo_traspaso, estado, autorizador, fecha_autorizacion, autorizador2, fecha_autorizacion2
    FROM testing.solicitudes_traspasos_v2;
""")
rows = cur.fetchall()
print("All solicitudes_traspasos_v2:")
for r in rows:
    print(f"  {r}")

cur.close()
conn.close()
