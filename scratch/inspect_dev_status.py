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

# Get all fields for TRP-DEV-2026-0003
cur.execute("""
    SELECT *
    FROM testing.solicitudes_traspasos_v2
    WHERE folio = 'TRP-DEV-2026-0003';
""")
row = cur.fetchone()
print("TRP-DEV-2026-0003 row:")
if row:
    # Print column names and values
    colnames = [desc[0] for desc in cur.description]
    for col, val in zip(colnames, row):
        print(f"  {col}: {val}")
else:
    print("  Not found!")

cur.close()
conn.close()
