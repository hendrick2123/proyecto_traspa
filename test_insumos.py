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

    # Column names of prof_insumos
    cur.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'testing'
          AND table_name = 'prof_insumos'
        ORDER BY ordinal_position;
    """)
    cols = cur.fetchall()
    print("--- Columnas prof_insumos ---")
    for c in cols:
        print(f"  {c[0]:30s}  {c[1]}")

    cur.close()
    conn.close()

except Exception as e:
    print(f"ERROR: {e}")
