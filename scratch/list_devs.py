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

# Get all DEV traspasos
cur.execute("""
    SELECT id_solicitud, folio, tipo_traspaso, solicitante, estado, cc_origen, cc_destino, folio_original_ref
    FROM testing.solicitudes_traspasos_v2
    WHERE tipo_traspaso = 'DEV';
""")
print("DEV traspasos in database:")
for row in cur.fetchall():
    print(f"  {row}")

cur.close()
conn.close()
