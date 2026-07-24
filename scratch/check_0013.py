import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

host = os.getenv('DB_HOST')
port = os.getenv('DB_PORT', 6543)
dbname = os.getenv('DB_NAME', 'postgres')
user = os.getenv('DB_USER')
password = os.getenv('DB_PASSWORD')

conn = psycopg2.connect(host=host, port=port, dbname=dbname, user=user, password=password)
cur = conn.cursor()
cur.execute("SELECT id_solicitud, folio, cc_origen, cc_destino, empresa_origen, empresa_destino FROM testing.solicitudes_traspasos_v2 WHERE folio LIKE '%0013%';")
rows = cur.fetchall()
print("ROWS IN DB:")
for r in rows:
    print(r)
cur.close()
conn.close()
