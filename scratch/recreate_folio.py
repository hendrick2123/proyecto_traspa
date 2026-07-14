import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db_config import get_db_connection
import datetime

conn = get_db_connection()
cur = conn.cursor()

try:
    cur.execute("""
        INSERT INTO testing.solicitudes_traspasos_v2 
            (folio, tipo_traspaso, solicitante, estado, empresa_origen, empresa_destino, cc_origen, cc_destino, fecha_solicitud, observaciones)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id_solicitud;
    """, (
        'TRP-PRS-2026-0001',
        'PRÉSTAMO',
        'Usuario Sistema',
        'PEND. CONTROL',
        'DESARROLLADORA',
        'MARGOPH',
        'JAMAICA PARK COSTO DIRECTO',
        'FLORESTA 2 COSTO DIRECTO',
        datetime.datetime.strptime('08/07/2026', '%d/%m/%Y'),
        'Recreado tras borrado accidental'
    ))
    sol_id = cur.fetchone()[0]
    conn.commit()
    print(f"Exito! Registro insertado con id_solicitud: {sol_id}")
except Exception as e:
    conn.rollback()
    print(f"Error: {e}")
