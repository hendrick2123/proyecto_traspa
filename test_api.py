import urllib.request
import json

req = urllib.request.Request("http://localhost:8000/api/state")
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        insumos = data.get("insumos", [])
        print(f"Total insumos returned: {len(insumos)}")
        other_companies = [i for i in insumos if "EK_ADM01_11" not in i.get('clave', '')]
        print(f"Insumos not belonging to company 1: {len(other_companies)}")
        if other_companies:
            print("Sample other company insumos:")
            for i in other_companies[:5]:
                print(f"  {i.get('clave')} - {i.get('nombre')}")
except Exception as e:
    print("Error:", e)
