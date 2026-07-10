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

# Get triggers on solicitudes_traspasos_v2
cur.execute("""
    SELECT tgname, pg_get_triggerdef(t.oid)
    FROM pg_trigger t
    JOIN pg_class cl ON cl.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = cl.relnamespace
    WHERE n.nspname = 'testing' AND cl.relname = 'solicitudes_traspasos_v2';
""")
print("Triggers on solicitudes_traspasos_v2:")
for name, definition in cur.fetchall():
    print(f"  {name}: {definition}")

cur.close()
conn.close()
