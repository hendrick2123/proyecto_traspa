"""
Script rápido: columnas + 2 filas de testing.prof_insumos_v2
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db_config import DB_CONFIG
import psycopg2

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()

# 1) Columnas
cur.execute("""
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'testing'
      AND table_name = 'prof_insumos_v2'
    ORDER BY ordinal_position;
""")
cols = cur.fetchall()
print("=== Columnas de testing.prof_insumos_v2 ===")
for c in cols:
    print(f"  {c[0]:30s}  {c[1]}")
print(f"\nTotal columnas: {len(cols)}\n")

# 2) Chunk de 2 filas
col_names = [c[0] for c in cols]
cur.execute("SELECT * FROM testing.prof_insumos_v2 LIMIT 2;")
rows = cur.fetchall()
print("=== 2 filas de muestra ===")
for i, row in enumerate(rows):
    print(f"\n--- Fila {i+1} ---")
    for name, val in zip(col_names, row):
        print(f"  {name:30s}  {val}")

cur.close()
conn.close()
