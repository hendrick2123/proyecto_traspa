import psycopg2

DB_CONFIG = {
    "host": "aws-1-us-east-1.pooler.supabase.com",
    "port": "6543",
    "dbname": "postgres",
    "user": "hendrick_user.vgxlpfsjruugrdiomjft",
    "password": "HendrickPostgresData2077!"
}

try:
    print("Connecting to database...")
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # Truncate tables with CASCADE and restart identity
    print("Truncating testing.detalle_traspaso_insumos_v2 and testing.solicitudes_traspasos_v2...")
    cur.execute("TRUNCATE TABLE testing.detalle_traspaso_insumos_v2 RESTART IDENTITY CASCADE;")
    cur.execute("TRUNCATE TABLE testing.solicitudes_traspasos_v2 RESTART IDENTITY CASCADE;")
    
    conn.commit()
    print("Cleanup successful! Database is now clean of test traspaso records.")

    cur.close()
    conn.close()

except Exception as e:
    print(f"Error executing cleanup: {e}")
