from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY table_schema, table_name;
        """)
        tables = cur.fetchall()
        print("Tables found:")
        for t in tables:
            print(f" - {t[0]}.{t[1]}")
            
            # search columns in this table that have 'salida' or 'postventa'
            cur.execute("""
                SELECT column_name FROM information_schema.columns
                WHERE table_schema = %s AND table_name = %s;
            """, (t[0], t[1]))
            cols = [c[0] for c in cur.fetchall()]
            salida_cols = [c for c in cols if 'salida' in c.lower() or 'post' in c.lower() or 'hist' in c.lower()]
            if salida_cols:
                print(f"    Special columns in {t[0]}.{t[1]}: {salida_cols}")

        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
