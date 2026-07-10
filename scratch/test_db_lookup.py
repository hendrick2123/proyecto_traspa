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

def test_lookup():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    insumo_id = "1180002"
    nombre = ""
    unidad = ""
    
    print("Testing lookup with:", insumo_id)
    cur.execute("SELECT descripcion, unidad FROM testing.prof_insumos_v2 WHERE insumo = %s LIMIT 1;", (insumo_id,))
    row = cur.fetchone()
    print("Row fetched:", row)
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    test_lookup()
