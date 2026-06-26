import urllib.request
import json
import psycopg2

API_URL = "http://localhost:8000/api/state"

# 1. Login to get token
login_url = "http://localhost:8000/api/auth/login"
login_data = json.dumps({"username": "admin", "password": "admin123"}).encode('utf-8')
req = urllib.request.Request(login_url, data=login_data, headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as response:
        res_data = json.loads(response.read().decode('utf-8'))
        token = res_data.get('token')
        print("Login successful. Token:", token)
except Exception as e:
    print("Login failed:", e)
    exit(1)

# 2. Get current state to preserve other fields
state_req = urllib.request.Request(API_URL, headers={'Authorization': f'Bearer {token}'})
try:
    with urllib.request.urlopen(state_req) as response:
        state = json.loads(response.read().decode('utf-8'))
except Exception as e:
    print("Fetch state failed:", e)
    exit(1)

# 3. Create a test transfer to CC 999
test_folio = "TRP-TOB-2026-TEST"
new_transfer = {
    "id": "T_TEST_123",
    "folio": test_folio,
    "tipo": "TOB",
    "status": "pendiente",
    "solicitante": "Test Runner",
    "empresaOrigen": "TOKIO",
    "ccOrigen": "CC001",
    "empresaDestino": "99",
    "ccDestino": "999",
    "observaciones": "Simulated request for verification",
    "fechaSolicitud": "2026-06-26T12:00:00Z",
    "items": [
        {
            "insumoId": "1180002",  
            # Note: We omit name ("nombre") and unit ("unidad") to test the server-side catalog lookup fallback!
            "cantidad": 5.0,
            "precio": 85.50,
            "comentario": "Need 5 pieces/kg for testing",
            "imagen": "/uploads/test_image.jpg"
        }
    ]
}

# Add our test transfer to the state
state["traspasos"] = [new_transfer]

# 4. Save state back to server
save_data = json.dumps(state).encode('utf-8')
save_req = urllib.request.Request(
    API_URL, 
    data=save_data, 
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
)

try:
    with urllib.request.urlopen(save_req) as response:
        result = json.loads(response.read().decode('utf-8'))
        print("Save state result:", result)
except Exception as e:
    print("Save state failed:", e)
    exit(1)

# 5. Query DB directly to verify how the item was stored
DB_CONFIG = {
    "host": "aws-1-us-east-1.pooler.supabase.com",
    "port": "6543",
    "dbname": "postgres",
    "user": "hendrick_user.vgxlpfsjruugrdiomjft",
    "password": "HendrickPostgresData2077!"
}

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()

# Get the solicitation
cur.execute("SELECT id_solicitud FROM testing.solicitudes_traspasos_v2 WHERE folio = %s;", (test_folio,))
sol_row = cur.fetchone()
if sol_row:
    sol_id = sol_row[0]
    print(f"Found solicitation in DB: id={sol_id}")
    
    # Get the detail items
    cur.execute("""
        SELECT clave_insumo, nombre_insumo, cantidad, unidad, precio, comentario_insumo, imagen
        FROM testing.detalle_traspaso_insumos_v2
        WHERE id_solicitud = %s;
    """, (sol_id,))
    items = cur.fetchall()
    print("Stored items in database:")
    for item in items:
        print(f"  Clave: {item[0]}")
        print(f"  Nombre: {item[1]}")
        print(f"  Cantidad: {item[2]}")
        print(f"  Unidad: {item[3]}")
        print(f"  Precio: {item[4]}")
        print(f"  Comentario: {item[5]}")
        print(f"  Imagen: {item[6]}")
        
    # Clean up the test record
    cur.execute("DELETE FROM testing.solicitudes_traspasos_v2 WHERE id_solicitud = %s;", (sol_id,))
    conn.commit()
    print("Database cleaned successfully.")
else:
    print("Test solicitation was not found in DB!")

cur.close()
conn.close()
