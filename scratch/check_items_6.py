import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db_config import get_db_connection

try:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM testing.detalle_traspaso_insumos_v2 WHERE id_solicitud = 6;")
    print("Items id_solicitud 6:", cur.fetchall())
    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
