import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db_config import DB_CONFIG
import psycopg2

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()

try:
    print("Deleting from detalle_traspaso_insumos_v2 for id_solicitud = 2 (TRP-PRS-2026-0001)...")
    cur.execute("DELETE FROM testing.detalle_traspaso_insumos_v2 WHERE id_solicitud = 2;")
    deleted_details = cur.rowcount
    print(f"Details deleted: {deleted_details}")

    print("Deleting from solicitudes_traspasos_v2 for id_solicitud = 2 (TRP-PRS-2026-0001)...")
    cur.execute("DELETE FROM testing.solicitudes_traspasos_v2 WHERE id_solicitud = 2;")
    deleted_master = cur.rowcount
    print(f"Master records deleted: {deleted_master}")

    conn.commit()
    print("Transaction committed successfully!")
except Exception as e:
    conn.rollback()
    print(f"Error during deletion: {e}")
finally:
    cur.close()
    conn.close()
