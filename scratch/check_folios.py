import psycopg2

# Cargar DB_CONFIG de forma segura desde db_config.py
import sys
import os
# Agregar directorios para buscar db_config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from db_config import DB_CONFIG
except ImportError:
    DB_CONFIG = {}

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()

# Check all traspasos and their folios
cur.execute("""
    SELECT id_solicitud, folio, tipo_traspaso, estado, solicitante, 
           cc_origen, cc_destino, fecha_solicitud
    FROM testing.solicitudes_traspasos_v2
    ORDER BY id_solicitud;
""")
rows = cur.fetchall()
colnames = [desc[0] for desc in cur.description]

print(f"Total registros: {len(rows)}\n")
print("-" * 120)
for r in rows:
    print(f"  ID={r[0]} | Folio={r[1]} | Tipo={r[2]} | Estado={r[3]} | Solicitante={r[4]} | Origen={r[5]} | Destino={r[6]} | Fecha={r[7]}")
print("-" * 120)

# Check for duplicate folios
cur.execute("""
    SELECT folio, COUNT(*) as cnt 
    FROM testing.solicitudes_traspasos_v2 
    GROUP BY folio 
    HAVING COUNT(*) > 1;
""")
dupes = cur.fetchall()
if dupes:
    print(f"\n⚠️ FOLIOS DUPLICADOS ENCONTRADOS:")
    for d in dupes:
        print(f"  Folio: {d[0]} - Aparece {d[1]} veces")
else:
    print(f"\n✅ No hay folios duplicados en la base de datos.")

# Check max folio per prefix
for prefix in ['PRS', 'TOB', 'DEV', 'GAR']:
    cur.execute("""
        SELECT folio FROM testing.solicitudes_traspasos_v2
        WHERE folio LIKE %s
        ORDER BY id_solicitud DESC LIMIT 1;
    """, (f"TRP-{prefix}-%",))
    row = cur.fetchone()
    max_num = 0
    if row:
        parts = row[0].split("-")
        if len(parts) == 4:
            max_num = int(parts[3])
    print(f"  Max {prefix}: {max_num} (último folio: {row[0] if row else 'ninguno'})")

cur.close()
conn.close()
