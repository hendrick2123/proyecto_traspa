import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from server import DB_CONFIG
import psycopg2

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()

print("--- testing.insumos_postventa sample ---")
cur.execute("SELECT id, descripcion FROM testing.insumos_postventa LIMIT 5;")
print(cur.fetchall())

print("\n--- testing.historial_postventa sample ---")
cur.execute("SELECT * FROM testing.historial_postventa ORDER BY id_historial DESC LIMIT 5;")
print(cur.fetchall())

print("\n--- JOIN query test ---")
cur.execute("""
    SELECT h.id_historial, h.id_insumo_pv, 
           i.id as ins_id, i.descripcion as ins_desc,
           h.cantidad_anterior, h.cantidad_agregada, h.salida, h.cantidad_total,
           h.orden_compra, h.usuario, h.fecha_movimiento
    FROM testing.historial_postventa h
    LEFT JOIN testing.insumos_postventa i ON h.id_insumo_pv = i.id
    ORDER BY h.fecha_movimiento DESC;
""")
print(cur.fetchall())
conn.close()
