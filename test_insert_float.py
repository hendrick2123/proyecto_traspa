import psycopg2

DB_CONFIG = {
    "host": "aws-1-us-east-1.pooler.supabase.com",
    "port": "6543",
    "dbname": "postgres",
    "user": "hendrick_user.vgxlpfsjruugrdiomjft",
    "password": "HendrickPostgresData2077!"
}

try:
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    print("Conexion exitosa\n")

    # Insert test Solicitud
    cur.execute("""
        INSERT INTO testing."Solicitud_traspasos"
            (folio, tipo_traspaso, solicitante, cc_origen, cc_destino, fecha_solicitud)
        VALUES ('TEST-FLOAT-001', 'PRS', 'Test Float', 'CC001', 'CC002', '2026-06-04')
        RETURNING id_solicitud;
    """)
    sol_id = cur.fetchone()[0]
    print(f"Solicitud insertada con ID: {sol_id}")

    # Intentar insertar un float en cantidad (que es INTEGER)
    try:
        cur.execute("""
            INSERT INTO testing."Detalle_traspaso_insumos"
                (id_solicitud, clave_insumo, nombre_insumo, cantidad, unidad)
            VALUES (%s, %s, %s, %s, %s);
        """, (sol_id, 'INS-001', 'Cemento', 1.5, 'Bulto'))
        print("Insert FLOAT directo exitoso!")
    except Exception as e:
        print(f"Error al insertar float directo: {e}")
        conn.rollback()
        cur = conn.cursor()

    # Intentar insertar con casteo/redondeo si falló, o ver qué pasó
    conn.rollback()
    cur.close()
    conn.close()

except Exception as e:
    print(f"ERROR: {e}")
