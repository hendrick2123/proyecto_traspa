import psycopg2
from dotenv import load_dotenv
import os

load_dotenv('.env')

def main():
    conn = psycopg2.connect(
        dbname=os.environ.get('DB_NAME', 'traspa'),
        user=os.environ.get('DB_USER', 'postgres'),
        password=os.environ.get('DB_PASSWORD', 'postgres'),
        host=os.environ.get('DB_HOST', 'localhost')
    )
    cur = conn.cursor()
    
    print("In testing.prof_insumos_v2:")
    try:
        cur.execute("SELECT insumo, descripcion FROM testing.prof_insumos_v2 WHERE descripcion ILIKE '%escalera%'")
        for r in cur.fetchall():
            print(f"  {r[0]} | {r[1]}")
    except Exception as e:
        print(f"  Error: {e}")
        conn.rollback()
        
    print("\nIn testing.prof_insumos (si existe):")
    try:
        cur.execute("SELECT insumo, descripcion FROM testing.prof_insumos WHERE descripcion ILIKE '%escalera%'")
        for r in cur.fetchall():
            print(f"  {r[0]} | {r[1]}")
    except Exception as e:
        print(f"  Error: {e}")
        conn.rollback()

    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
