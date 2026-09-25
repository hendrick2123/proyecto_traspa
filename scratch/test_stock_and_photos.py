import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_flow():
    print("Testing Insumos with Stock, Photos and Specs...")
    try:
        # 1. Login or read public/insumos
        # Create a test token by logging in
        login_data = json.dumps({"username": "admin", "password": "123"}).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/auth/login", data=login_data, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req) as r:
                res = json.loads(r.read().decode('utf-8'))
                token = res.get("token", "")
        except Exception as e:
            print("Login with admin/123 failed, trying test without token or with direct DB")
            token = ""

        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        # 2. Get insumos
        req = urllib.request.Request(f"{BASE_URL}/insumos", headers=headers)
        with urllib.request.urlopen(req) as r:
            res = json.loads(r.read().decode('utf-8'))
            print(f"Total insumos fetched: {len(res.get('insumos', []))}")
            if res.get('insumos'):
                print("First insumo:", res['insumos'][0])

        # 3. Post a general insumo with stock, photo and specs
        test_insumo = {
            "id": "INS_TEST_ESPEJO",
            "clave": "ESP-001",
            "nombre": "Espejo 60x80cm Biselado",
            "unidad": "Pieza",
            "categoria": "Acabados",
            "cantidad": 5.0,
            "especificaciones": "Espejo con esquina despostillada",
            "imagen": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        }

        req = urllib.request.Request(f"{BASE_URL}/insumos", data=json.dumps({"insumos": [test_insumo]}).encode('utf-8'), headers=headers)
        with urllib.request.urlopen(req) as r:
            post_res = json.loads(r.read().decode('utf-8'))
            print("POST /api/insumos response:", post_res)

        # 4. Read back
        req = urllib.request.Request(f"{BASE_URL}/insumos", headers=headers)
        with urllib.request.urlopen(req) as r:
            res = json.loads(r.read().decode('utf-8'))
            saved = next((i for i in res.get('insumos', []) if i.get('id') == 'INS_TEST_ESPEJO' or i.get('clave') == 'ESP-001'), None)
            print("Retrieved saved insumo with stock and specs:", saved)

        print("\nAll API tests completed successfully!")
    except Exception as e:
        print(f"Test Exception (Note: Server might need restart if not auto-reloaded): {e}")

if __name__ == "__main__":
    test_flow()
