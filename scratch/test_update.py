import sys
import os

# Import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from server_fastapi import save_db_traspaso, get_db_connection

# Sample test traspaso data that represents what frontend sends for updating TRP-PRS-2026-0001
test_traspaso = {
    "id": "DB2",
    "folio": "TRP-PRS-2026-0001",
    "tipo": "PRS",
    "status": "pre_autorizado",
    "autorizador": "Test Residente",
    "fechaAutorizacion": "2026-07-09T17:00:00Z",
    "comentarioAuth": "Comentario de prueba",
    "receptor": None,
    "fechaRecepcion": None,
    "comentarioRec": None,
    "observaciones": "Test observaciones",
    "autorizador2": None,
    "fechaAutorizacion2": None,
    "comentarioAuth2": None,
    "folioOriginalRef": None,
    "items": []
}

try:
    print("Testing save_db_traspaso directly...")
    result = save_db_traspaso(test_traspaso)
    print(f"Result (should be id_solicitud): {result}")
    
    # Check if updated in database
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT estado, autorizador, fecha_autorizacion, comentario_auth FROM testing.solicitudes_traspasos_v2 WHERE folio = %s;", (test_traspaso["folio"],))
    row = cur.fetchone()
    print(f"Row after update: {row}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Exception during test: {e}")
