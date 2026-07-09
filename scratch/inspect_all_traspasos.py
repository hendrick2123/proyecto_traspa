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

# Get all fields for testing.solicitudes_traspasos_v2
cur.execute("""
    SELECT id_solicitud, folio, tipo_traspaso, estado, autorizador, fecha_autorizacion, autorizador2, fecha_autorizacion2
    FROM testing.solicitudes_traspasos_v2;
""")
rows = cur.fetchall()
print("All solicitudes_traspasos_v2:")
for r in rows:
    print(f"  {r}")

cur.close()
conn.close()
