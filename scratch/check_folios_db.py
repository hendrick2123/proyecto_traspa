import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db_config import get_db_connection

try:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id_solicitud, folio, tipo_traspaso, solicitante, fecha_solicitud, observaciones FROM testing.solicitudes_traspasos_v2 ORDER BY id_solicitud;")
    rows = cur.fetchall()
    print(f"Total solicitudes en DB: {len(rows)}")
    for r in rows:
        print(r)
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
