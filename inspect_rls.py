import psycopg2

# Cargar DB_CONFIG de forma segura desde db_config.py
import sys
import os
# Agregar directorios para buscar db_config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from db_config import DB_CONFIG
except ImportError:
    DB_CONFIG = {}

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
