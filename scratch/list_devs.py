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

# Get all DEV traspasos
cur.execute("""
    SELECT id_solicitud, folio, tipo_traspaso, solicitante, estado, cc_origen, cc_destino, folio_original_ref
    FROM testing.solicitudes_traspasos_v2
    WHERE tipo_traspaso = 'DEV';
""")
print("DEV traspasos in database:")
for row in cur.fetchall():
    print(f"  {row}")

cur.close()
conn.close()
