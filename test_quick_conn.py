import urllib.request
import json
import time

print("Probando conexion con 127.0.0.1...")
start = time.time()
try:
    with urllib.request.urlopen("http://127.0.0.1:8000/api/state") as r:
        data = json.loads(r.read().decode('utf-8'))
        print(f"Exito! Respondió en {time.time() - start:.2f}s")
        print(f"Traspasos: {len(data.get('traspasos', []))}")
except Exception as e:
    print(f"Error: {e}")
