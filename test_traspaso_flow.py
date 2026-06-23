import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000/api"
TIMEOUT = 10

# 1. Leer el estado inicial
print("--- 1. GET /api/state (Inicial) ---")
req = urllib.request.Request(f"{BASE_URL}/state")
try:
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        state = json.loads(r.read().decode('utf-8'))
        print(f"Traspasos en el estado inicial: {len(state.get('traspasos', []))}")
        print(f"Folios actuales: {state.get('folios')}")
except Exception as e:
    print(f"Error GET inicial: {e}")
    exit(1)

# 2. Enviar un nuevo traspaso (Simulación de creación por residente)
print("\n--- 2. POST /api/state (Crear Traspaso) ---")
nuevo_traspaso = {
    "folio": "TRP-PRS-2026-0001",
    "tipo": "PRS",
    "solicitante": "Juan Residente",
    "status": "pendiente",
    "empresaOrigen": "TOKIO",
    "empresaDestino": "TOKIO",
    "ccOrigen": "Othon Park",
    "ccDestino": "Ayanna Tepeyac",
    "fechaSolicitud": "2026-06-04T15:00:00",
    "observaciones": "Traspaso de prueba v2",
    "items": [
        {"insumoId": "MAT-001", "nombre": "Cemento Portland 50kg", "cantidad": 10.5, "unidad": "Bulto"},
        {"insumoId": "MAT-002", "nombre": "Varilla 3/8\"", "cantidad": 25.0, "unidad": "kg"}
    ]
}

post_data = json.dumps({"traspasos": [nuevo_traspaso]}).encode('utf-8')
req = urllib.request.Request(f"{BASE_URL}/state", data=post_data, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        res = json.loads(r.read().decode('utf-8'))
        print(f"Respuesta POST: {res}")
except Exception as e:
    print(f"Error POST creacion: {e}")
    exit(1)

# 3. Leer de nuevo para verificar persistencia y folios
print("\n--- 3. GET /api/state (Verificar creación) ---")
req = urllib.request.Request(f"{BASE_URL}/state")
try:
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        state = json.loads(r.read().decode('utf-8'))
        traspasos = state.get('traspasos', [])
        print(f"Total traspasos en estado: {len(traspasos)}")
        if traspasos:
            t = traspasos[-1]
            print(f"  Folio: {t.get('folio')}")
            print(f"  Solicitante: {t.get('solicitante')}")
            print(f"  Status: {t.get('status')}")
            print(f"  Insumos (items): {t.get('items')}")
        print(f"Folios actualizados: {state.get('folios')}")
except Exception as e:
    print(f"Error GET verificacion: {e}")
    exit(1)

# 4. Autorizar el traspaso (Simulación de admin)
print("\n--- 4. POST /api/state (Autorizar Traspaso) ---")
traspaso_autorizado = nuevo_traspaso.copy()
traspaso_autorizado.update({
    "status": "autorizado",
    "autorizador": "Pedro Admin",
    "fechaAutorizacion": "2026-06-04T16:00:00",
    "comentarioAuth": "Aprobado para envío"
})

post_data = json.dumps({"traspasos": [traspaso_autorizado]}).encode('utf-8')
req = urllib.request.Request(f"{BASE_URL}/state", data=post_data, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        res = json.loads(r.read().decode('utf-8'))
        print(f"Respuesta POST: {res}")
except Exception as e:
    print(f"Error POST autorizacion: {e}")
    exit(1)

# 5. Leer de nuevo para verificar los campos de autorización
print("\n--- 5. GET /api/state (Verificar autorización) ---")
req = urllib.request.Request(f"{BASE_URL}/state")
try:
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        state = json.loads(r.read().decode('utf-8'))
        traspasos = state.get('traspasos', [])
        if traspasos:
            t = traspasos[-1]
            print(f"  Folio: {t.get('folio')}")
            print(f"  Status: {t.get('status')}")
            print(f"  Autorizador: {t.get('autorizador')}")
            print(f"  Fecha Auth: {t.get('fechaAutorizacion')}")
            print(f"  Comentario Auth: {t.get('comentarioAuth')}")
except Exception as e:
    print(f"Error GET verificacion auth: {e}")
    exit(1)

# 6. Recibir el traspaso (Simulación de almacenista)
print("\n--- 6. POST /api/state (Recibir Traspaso) ---")
traspaso_recibido = traspaso_autorizado.copy()
traspaso_recibido.update({
    "status": "recibido",
    "receptor": "Maria Almacén",
    "fechaRecepcion": "2026-06-04T17:00:00",
    "comentarioRec": "Recibido completo y en buen estado"
})

post_data = json.dumps({"traspasos": [traspaso_recibido]}).encode('utf-8')
req = urllib.request.Request(f"{BASE_URL}/state", data=post_data, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        res = json.loads(r.read().decode('utf-8'))
        print(f"Respuesta POST: {res}")
except Exception as e:
    print(f"Error POST recepcion: {e}")
    exit(1)

# 7. Leer final para verificar todos los campos
print("\n--- 7. GET /api/state (Verificación Final) ---")
req = urllib.request.Request(f"{BASE_URL}/state")
try:
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        state = json.loads(r.read().decode('utf-8'))
        traspasos = state.get('traspasos', [])
        if traspasos:
            t = traspasos[-1]
            print(f"  Folio: {t.get('folio')}")
            print(f"  Status: {t.get('status')}")
            print(f"  Autorizador: {t.get('autorizador')}")
            print(f"  Comentario Auth: {t.get('comentarioAuth')}")
            print(f"  Receptor: {t.get('receptor')}")
            print(f"  Comentario Rec: {t.get('comentarioRec')}")
except Exception as e:
    print(f"Error GET final: {e}")
    exit(1)
