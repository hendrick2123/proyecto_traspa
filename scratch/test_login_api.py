import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import httpx

try:
    response = httpx.post("http://localhost:8000/api/auth/login", json={"username": "Hendrick", "password": "wrong_password"})
    print("Status Code:", response.status_code)
    print("JSON Response:", response.json())
except Exception as e:
    print("Error during login API request:", e)
