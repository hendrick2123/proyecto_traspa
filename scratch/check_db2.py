import psycopg2
import json

conn = psycopg2.connect('dbname=traspa user=postgres password=postgres host=localhost')
cur = conn.cursor()

print("--- SOLICITUDES ---")
cur.execute("SELECT id_solicitud, folio, cc_origen, cc_destino, observaciones FROM testing.solicitudes_traspasos_v2 WHERE folio = 'TRP-PRS-2026-0015'")
for row in cur.fetchall():
    print(row)

print("--- INSUMOS ---")
cur.execute("SELECT id_solicitud, clave_insumo, nombre_insumo FROM testing.detalle_traspaso_insumos_v2 WHERE id_solicitud IN (SELECT id_solicitud FROM testing.solicitudes_traspasos_v2 WHERE folio = 'TRP-PRS-2026-0015')")
for row in cur.fetchall():
    print(row)
