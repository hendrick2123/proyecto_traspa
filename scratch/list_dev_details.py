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

# Get details for DEV traspasos
cur.execute("""
    SELECT d.id_solicitud, s.folio, d.clave_insumo, d.nombre_insumo, d.cantidad
    FROM testing.detalle_traspaso_insumos_v2 d
    JOIN testing.solicitudes_traspasos_v2 s ON s.id_solicitud = d.id_solicitud
    WHERE s.tipo_traspaso = 'DEV';
""")
print("DEV details in database:")
for row in cur.fetchall():
    print(f"  {row}")

cur.close()
conn.close()
