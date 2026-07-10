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

# Verificar permisos del usuario en las tablas
print("=== Permisos en Solicitud_traspasos ===")
cur.execute("""
    SELECT privilege_type 
    FROM information_schema.table_privileges 
    WHERE table_schema='testing' AND table_name='Solicitud_traspasos'
    AND grantee = current_user;
""")
perms = cur.fetchall()
if perms:
    for p in perms:
        print(f"  {p[0]}")
else:
    print("  No se encontraron permisos directos. Probando con roles...")
    cur.execute("SELECT current_user, session_user;")
    print(f"  current_user={cur.fetchone()}")

print("\n=== Permisos en Detalle_traspaso_insumos ===")
cur.execute("""
    SELECT privilege_type 
    FROM information_schema.table_privileges 
    WHERE table_schema='testing' AND table_name='Detalle_traspaso_insumos'
    AND grantee = current_user;
""")
perms = cur.fetchall()
if perms:
    for p in perms:
        print(f"  {p[0]}")
else:
    print("  Sin permisos directos")

# Verificar owner
print("\n=== Owner de las tablas ===")
cur.execute("""
    SELECT tablename, tableowner 
    FROM pg_tables 
    WHERE schemaname='testing' AND tablename IN ('Solicitud_traspasos','Detalle_traspaso_insumos')
""")
for r in cur.fetchall():
    print(f"  {r[0]:30s} owner={r[1]}")

# Intentar un INSERT directo para ver el error exacto
print("\n=== Test INSERT directo ===")
try:
    cur.execute("""
        INSERT INTO testing."Solicitud_traspasos"
            (folio, tipo_traspaso, solicitante, estado, cc_origen, cc_destino, fecha_solicitud)
        VALUES ('TEST-PERM-001', 'PRS', 'Test', 'pendiente', 'CC001', 'CC002', '2026-06-04')
        RETURNING id_solicitud;
    """)
    test_id = cur.fetchone()[0]
    print(f"  INSERT exitoso! id={test_id}")
    cur.execute('DELETE FROM testing."Solicitud_traspasos" WHERE folio = %s;', ('TEST-PERM-001',))
    conn.commit()
    print("  DELETE exitoso, test limpio")
except Exception as e:
    print(f"  ERROR: {e}")
    conn.rollback()

# Intentar ADD COLUMN
print("\n=== Test ADD COLUMN autorizador ===")
try:
    cur.execute('ALTER TABLE testing."Solicitud_traspasos" ADD COLUMN IF NOT EXISTS autorizador VARCHAR(100) NULL;')
    conn.commit()
    print("  ADD COLUMN exitoso!")
except Exception as e:
    print(f"  ERROR: {e}")
    conn.rollback()

cur.close()
conn.close()
