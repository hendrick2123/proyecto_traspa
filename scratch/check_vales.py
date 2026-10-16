import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db_config import get_db_connection

conn = get_db_connection()
cur = conn.cursor()

cur.execute("""
    SELECT id_solicitud, folio, tipo_traspaso, solicitante, estado, autorizador, autorizador2
    FROM testing.solicitudes_traspasos_v2
    WHERE folio IN ('TRP-PRS-2026-0015', 'TRP-TOB-2026-0010');
""")
rows = cur.fetchall()
for r in rows:
    print(r)

cur.execute("""
    SELECT conname, pg_get_constraintdef(oid) 
    FROM pg_constraint 
    WHERE conrelid = 'testing.solicitudes_traspasos_v2'::regclass;
""")
for c in cur.fetchall():
    print("Constraint:", c)

cur.close()
conn.close()
