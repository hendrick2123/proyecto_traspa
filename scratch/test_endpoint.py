import urllib.request
import json

url = "http://localhost:8000/api/auth/login"
req = urllib.request.Request(
    url,
    data=json.dumps({"username": "admin", "password": "123"}).encode('utf-8'),
    headers={"Content-Type": "application/json"}
)

try:
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode('utf-8'))
    token = data.get("access_token")
    
    req_pv = urllib.request.Request(
        "http://localhost:8000/api/insumos_postventa",
        headers={"Authorization": f"Bearer {token}"}
    )
    res_pv = urllib.request.urlopen(req_pv)
    data_pv = json.loads(res_pv.read().decode('utf-8'))
    print("Fetched count:", len(data_pv["insumos"]))
    print("Sample items with cantidad:")
    for i in data_pv["insumos"][:5]:
        print(i)
except Exception as e:
    print("Error:", e)
