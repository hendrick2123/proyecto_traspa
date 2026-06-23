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

    # Obtener politicas RLS
    cur.execute("""
        SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
        FROM pg_policies
        WHERE schemaname = 'testing';
    """)
    policies = cur.fetchall()
    print("--- Politicas RLS ---")
    for p in policies:
        print(f"Schema: {p[0]}")
        print(f"Table:  {p[1]}")
        print(f"Policy: {p[2]}")
        print(f"Roles:  {p[3]}")
        print(f"Cmd:    {p[4]}")
        print(f"Qual:   {p[5]}")
        print(f"WithCheck: {p[6]}")
        print("-" * 40)

    cur.close()
    conn.close()

except Exception as e:
    print(f"ERROR: {e}")
