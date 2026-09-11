import os, psycopg2

DB_HOST = os.getenv("DB_HOST", "aws-1-us-east-1.pooler.supabase.com")
DB_PORT = int(os.getenv("DB_PORT", "6543"))
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "hendrick_user.vgxlpfsjruugrdiomjft")
DB_PASSWORD = os.getenv("DB_PASSWORD", "HendrickPostgresData2077!")

conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD)
cur = conn.cursor()
cur.execute("SELECT id, descripcion, unidad, especialidad FROM testing.insumos_postventa ORDER BY id;")
rows = cur.fetchall()
for r in rows:
    print(f"PV-{r[0]} | {r[1]} | {r[2]} | {r[3]}")
cur.close()
conn.close()
