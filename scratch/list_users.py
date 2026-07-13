import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db_config import DB_CONFIG
import psycopg2

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()
cur.execute("""
    SELECT id, nombre, username, correo, rol, activo, empresa_id, cc_ids, creado_en
    FROM testing.prof_usuarios ORDER BY id;
""")
rows = cur.fetchall()
cols = [d[0] for d in cur.description]

print(f"Total usuarios: {len(rows)}\n")
for r in rows:
    print(f"  ID={r[0]} | Nombre={r[1]} | Username={r[2]} | Correo={r[3]} | Rol={r[4]} | Activo={r[5]} | Empresa={r[6]} | CCs={r[7]} | Creado={r[8]}")

cur.close()
conn.close()
