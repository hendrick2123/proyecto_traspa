import sys
import os
import traceback

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from db_config import get_db_connection

try:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, nombre, correo, username, rol, activo, empresa_id, cc_ids, password FROM testing.prof_usuarios WHERE username = %s", ('Hendrick',))
    row = cur.fetchone()
    print("Database Query Result:", row)
    cur.close()
    conn.close()
except Exception as e:
    print("Database / Code Error Details:")
    traceback.print_exc()
