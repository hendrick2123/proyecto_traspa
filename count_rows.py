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

    cur.execute('SELECT COUNT(*) FROM testing."Solicitud_traspasos";')
    print(f"Solicitud_traspasos count: {cur.fetchone()[0]}")

    cur.execute('SELECT COUNT(*) FROM testing."Detalle_traspaso_insumos";')
    print(f"Detalle_traspaso_insumos count: {cur.fetchone()[0]}")

    cur.close()
    conn.close()

except Exception as e:
    print(f"ERROR: {e}")
