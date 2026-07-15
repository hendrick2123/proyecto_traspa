import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db_config import DB_CONFIG
import psycopg2

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()

# Ver todos los campos del traspaso TRP-PRS-2026-0001
cur.execute("""
    SELECT * FROM testing.solicitudes_traspasos_v2 WHERE folio = 'TRP-PRS-2026-0001';
""")
row = cur.fetchone()
cols = [d[0] for d in cur.description]

print("=== TRP-PRS-2026-0001 ===")
for col, val in zip(cols, row):
    print(f"  {col} = {val}")

cur.close()
conn.close()
