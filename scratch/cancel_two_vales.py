import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db_config import get_db_connection

conn = get_db_connection()
cur = conn.cursor()

# Cancelar TRP-PRS-2026-0015
cur.execute("""
    UPDATE testing.solicitudes_traspasos_v2
    SET estado = 'rechazado',
        observaciones = COALESCE(observaciones, '') || E'\n[Cancelado a solicitud del usuario el 16/10/2026]'
    WHERE folio = 'TRP-PRS-2026-0015'
    RETURNING id_solicitud, folio, estado, observaciones;
""")
res1 = cur.fetchone()
print("Actualizado:", res1)

# Cancelar TRP-TOB-2026-0010
cur.execute("""
    UPDATE testing.solicitudes_traspasos_v2
    SET estado = 'rechazado',
        observaciones = COALESCE(observaciones, '') || E'\n[Cancelado a solicitud del usuario el 16/10/2026]'
    WHERE folio = 'TRP-TOB-2026-0010'
    RETURNING id_solicitud, folio, estado, observaciones;
""")
res2 = cur.fetchone()
print("Actualizado:", res2)

conn.commit()
cur.close()
conn.close()
