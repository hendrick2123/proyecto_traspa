from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        print("=== testing.historial_postventa columns ===")
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema='testing' AND table_name='historial_postventa'
            ORDER BY ordinal_position;
        """)
        for c in cur.fetchall():
            print(f"  {c[0]} ({c[1]})")

        print("\n=== Sample rows in testing.historial_postventa ===")
        cur.execute("SELECT * FROM testing.historial_postventa LIMIT 10;")
        for r in cur.fetchall():
            print(r)

        print("\n=== testing.insumos_postventa columns ===")
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema='testing' AND table_name='insumos_postventa'
            ORDER BY ordinal_position;
        """)
        for c in cur.fetchall():
            print(f"  {c[0]} ({c[1]})")

        print("\n=== Sample rows in testing.insumos_postventa ===")
        cur.execute("SELECT * FROM testing.insumos_postventa LIMIT 10;")
        for r in cur.fetchall():
            print(r)

        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
