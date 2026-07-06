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

# Get triggers on solicitudes_traspasos_v2
cur.execute("""
    SELECT tgname, pg_get_triggerdef(t.oid)
    FROM pg_trigger t
    JOIN pg_class cl ON cl.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = cl.relnamespace
    WHERE n.nspname = 'testing' AND cl.relname = 'solicitudes_traspasos_v2';
""")
print("Triggers on solicitudes_traspasos_v2:")
for name, definition in cur.fetchall():
    print(f"  {name}: {definition}")

cur.close()
conn.close()
