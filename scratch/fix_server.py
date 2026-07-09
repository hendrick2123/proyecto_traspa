import os
import re

file_path = r"c:\Users\Ramses Obregon\Desktop\Proyectos\proyecto_traspa\server_fastapi.py"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Convert async def to def for GET routes
routes_to_sync = [
    "api_public_empresas",
    "api_public_centros_costo",
    "api_get_empresas",
    "api_get_centros_costo",
    "api_get_insumos",
    "api_get_desarrollos",
    "api_get_traspasos",
    "api_get_folios",
    "api_get_state",
    "api_get_users",
]

for route in routes_to_sync:
    content = re.sub(rf"async def {route}\(", rf"def {route}(", content)

# 2. For POST routes, we will keep them as async def, but wrap their DB logic using run_in_threadpool 
# Wait, it's easier to just fix the connection leaks. 
# Fixing connection leaks is better. We can use a regex to replace the standard try/except blocks with try/finally.
# Or better, we can replace all `def get_db_connection(): return psycopg2.connect(**DB_CONFIG)` 
# Wait! We can redefine how get_db_connection is used. 
# If we change `conn = get_db_connection()` to always be properly managed... it's a lot of places to change via regex.

# Let's fix the specific connection leaks manually by injecting `finally: if 'conn' in locals() and conn: try: conn.close() except: pass` in the methods.
# Actually, if we just use a small decorator or run_in_threadpool wrapper for the entire route... 

# Let's write the modified content back
with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Changed async def to def for GET routes.")
