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

# Get details for DEV traspasos
cur.execute("""
    SELECT d.id_solicitud, s.folio, d.clave_insumo, d.nombre_insumo, d.cantidad
    FROM testing.detalle_traspaso_insumos_v2 d
    JOIN testing.solicitudes_traspasos_v2 s ON s.id_solicitud = d.id_solicitud
    WHERE s.tipo_traspaso = 'DEV';
""")
print("DEV details in database:")
for row in cur.fetchall():
    print(f"  {row}")

cur.close()
conn.close()
