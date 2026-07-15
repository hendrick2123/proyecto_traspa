import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db_config import get_db_connection
import datetime

conn = get_db_connection()
cur = conn.cursor()

try:
    cur.execute("""
        UPDATE testing.solicitudes_traspasos_v2 
        SET estado = %s,
            autorizador = %s,
            fecha_autorizacion = %s,
            autorizador2 = %s,
            fecha_autorizacion2 = %s
        WHERE folio = 'TRP-PRS-2026-0001';
    """, (
        'autorizado',
        'EDGAR ANTONIO CARO OLIVER',
        datetime.datetime.strptime('08/07/2026 12:00:00', '%d/%m/%Y %H:%M:%S'),
        'ESTEPHANYA SANCHEZ DE LA PAZ',
        datetime.datetime.strptime('08/07/2026 13:00:00', '%d/%m/%Y %H:%M:%S')
    ))
    conn.commit()
    print("Exito! Registro autorizado.")
except Exception as e:
    conn.rollback()
    print(f"Error: {e}")
