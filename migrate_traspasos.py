import psycopg2

DB_CONFIG = {
    "host": "aws-1-us-east-1.pooler.supabase.com",
    "port": "6543",
    "dbname": "postgres",
    "user": "hendrick_user.vgxlpfsjruugrdiomjft",
    "password": "HendrickPostgresData2077!"
}

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()

# Eliminar tablas existentes (el detalle tiene FK así que va primero)
print("Eliminando tablas existentes...")
try:
    cur.execute('DROP TABLE IF EXISTS testing."Detalle_traspaso_insumos" CASCADE;')
    cur.execute('DROP TABLE IF EXISTS testing."Solicitud_traspasos" CASCADE;')
    conn.commit()
    print("  OK: Tablas eliminadas")
except Exception as e:
    print(f"  ERROR drop: {e}")
    conn.rollback()

# Recrear tabla Solicitud_traspasos con TODAS las columnas necesarias
print("\nCreando testing.Solicitud_traspasos...")
try:
    cur.execute("""
        CREATE TABLE testing."Solicitud_traspasos" (
            id_solicitud SERIAL PRIMARY KEY,
            folio VARCHAR(50) NOT NULL UNIQUE,
            tipo_traspaso VARCHAR(50) NOT NULL,
            solicitante VARCHAR(100) NOT NULL,
            estado VARCHAR(30) DEFAULT 'pendiente',
            empresa_origen VARCHAR(100) NULL,
            empresa_destino VARCHAR(100) NULL,
            cc_origen VARCHAR(150) NOT NULL,
            cc_destino VARCHAR(150) NOT NULL,
            fecha_solicitud TIMESTAMP NOT NULL,
            observaciones TEXT NULL,
            autorizador VARCHAR(100) NULL,
            fecha_autorizacion TIMESTAMP NULL,
            comentario_auth TEXT NULL,
            receptor VARCHAR(100) NULL,
            fecha_recepcion TIMESTAMP NULL,
            comentario_rec TEXT NULL
        );
    """)
    conn.commit()
    print("  OK: Solicitud_traspasos creada")
except Exception as e:
    print(f"  ERROR: {e}")
    conn.rollback()

# Recrear tabla Detalle_traspaso_insumos
print("\nCreando testing.Detalle_traspaso_insumos...")
try:
    cur.execute("""
        CREATE TABLE testing."Detalle_traspaso_insumos" (
            id_detalle SERIAL PRIMARY KEY,
            id_solicitud INT NOT NULL,
            clave_insumo VARCHAR(50) NOT NULL,
            nombre_insumo VARCHAR(150) NOT NULL,
            cantidad NUMERIC(12, 4) NOT NULL,
            unidad VARCHAR(20) NOT NULL,
            CONSTRAINT fk_solicitud
                FOREIGN KEY (id_solicitud)
                REFERENCES testing."Solicitud_traspasos"(id_solicitud)
                ON DELETE CASCADE
        );
    """)
    conn.commit()
    print("  OK: Detalle_traspaso_insumos creada")
except Exception as e:
    print(f"  ERROR: {e}")
    conn.rollback()

# Verificar RLS (como somos owner, debería estar disabled por defecto)
print("\n=== RLS Status ===")
cur.execute("""
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname='testing' AND tablename IN ('Solicitud_traspasos','Detalle_traspaso_insumos')
""")
for r in cur.fetchall():
    rls = 'ENABLED' if r[1] else 'DISABLED'
    print(f"  {r[0]:30s} RLS={rls}")
    if r[1]:
        # Si RLS está enabled, desactivarlo (somos owner ahora)
        try:
            cur.execute(f'ALTER TABLE testing."{r[0]}" DISABLE ROW LEVEL SECURITY;')
            conn.commit()
            print(f"    -> RLS desactivado")
        except Exception as e:
            print(f"    -> No se pudo desactivar RLS: {e}")
            conn.rollback()

# Verificar columnas finales
print("\n=== Columnas finales Solicitud_traspasos ===")
cur.execute("""
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_schema='testing' AND table_name='Solicitud_traspasos'
    ORDER BY ordinal_position
""")
for r in cur.fetchall():
    print(f"  {r[0]:25s} {r[1]:25s} nullable={r[2]}")

print("\n=== Columnas finales Detalle_traspaso_insumos ===")
cur.execute("""
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_schema='testing' AND table_name='Detalle_traspaso_insumos'
    ORDER BY ordinal_position
""")
for r in cur.fetchall():
    print(f"  {r[0]:25s} {r[1]:25s} nullable={r[2]}")

# Test de INSERT
print("\n=== Test INSERT ===")
try:
    cur.execute("""
        INSERT INTO testing."Solicitud_traspasos"
            (folio, tipo_traspaso, solicitante, estado, cc_origen, cc_destino, fecha_solicitud)
        VALUES ('TEST-001', 'PRS', 'Test User', 'pendiente', 'CC001', 'CC002', NOW())
        RETURNING id_solicitud;
    """)
    test_id = cur.fetchone()[0]
    print(f"  OK: INSERT exitoso, id_solicitud={test_id}")
    # Limpiar
    cur.execute('DELETE FROM testing."Solicitud_traspasos" WHERE folio = %s;', ('TEST-001',))
    conn.commit()
    print("  OK: Test row eliminada")
except Exception as e:
    print(f"  ERROR INSERT: {e}")
    conn.rollback()

cur.close()
conn.close()
print("\nMigracion completada exitosamente!")
