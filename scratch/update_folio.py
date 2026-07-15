import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db_config import get_db_connection

conn = get_db_connection()
cur = conn.cursor()

try:
    cur.execute("""
        UPDATE testing.solicitudes_traspasos_v2 
        SET tipo_traspaso = %s,
            empresa_origen = %s,
            empresa_destino = %s,
            cc_origen = %s,
            cc_destino = %s,
            solicitante = %s
        WHERE folio = 'TRP-PRS-2026-0001';
    """, (
        'PRS',
        '1',
        '9',
        'A12EK_ADM01_11',
        '612EK_ADM09_11',
        'JESSICA ROSALES RIOS'
    ))
    conn.commit()
    print("Exito! Registro actualizado.")
except Exception as e:
    conn.rollback()
    print(f"Error: {e}")
