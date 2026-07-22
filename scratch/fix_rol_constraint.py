import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db_config import get_db_connection

try:
    conn = get_db_connection()
    cur = conn.cursor()
    print("Conectado a BD. Eliminando restriccion prof_usuarios_rol_check...")
    cur.execute("ALTER TABLE testing.prof_usuarios DROP CONSTRAINT IF EXISTS prof_usuarios_rol_check;")
    conn.commit()
    print("Restriccion eliminada exitosamente.")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
