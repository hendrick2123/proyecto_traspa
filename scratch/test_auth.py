import urllib.request
import json
import os, psycopg2

DB_HOST = os.getenv("DB_HOST", "aws-1-us-east-1.pooler.supabase.com")
DB_PORT = int(os.getenv("DB_PORT", "6543"))
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "hendrick_user.vgxlpfsjruugrdiomjft")
DB_PASSWORD = os.getenv("DB_PASSWORD", "HendrickPostgresData2077!")

conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD)
cur = conn.cursor()
cur.execute("SELECT username, rol FROM testing.prof_usuarios;")
users = cur.fetchall()
print("Users in DB:", users)
cur.close()
conn.close()
