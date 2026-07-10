import sys
import time
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

def test_db():
    print("Connecting to DB...")
    t0 = time.time()
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print(f"Connected in {time.time() - t0:.2f} seconds.")
        
        cur = conn.cursor()
        t1 = time.time()
        cur.execute("SELECT 1;")
        print(f"Execute SELECT 1 in {time.time() - t1:.2f} seconds.")
        print("Result:", cur.fetchone())
        
        t2 = time.time()
        cur.execute("SELECT COUNT(*) FROM testing.solicitudes_traspasos_v2;")
        print(f"Execute SELECT COUNT(*) in {time.time() - t2:.2f} seconds.")
        print("Traspasos count:", cur.fetchone()[0])
        
        cur.close()
        conn.close()
        print("Connection closed.")
    except Exception as e:
        print(f"DB Error: {e}")

if __name__ == "__main__":
    test_db()
