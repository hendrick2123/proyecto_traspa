from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        print("=== Checking permissions on testing.historial_postventa ===")
        cur.execute("""
            SELECT grantee, privilege_type 
            FROM information_schema.role_table_grants 
            WHERE table_schema = 'testing' AND table_name = 'historial_postventa';
        """)
        grants = cur.fetchall()
        for g in grants:
            print(f"  Grantee: {g[0]}, Privilege: {g[1]}")

        print("\n=== Checking permissions on testing.insumos_postventa ===")
        cur.execute("""
            SELECT grantee, privilege_type 
            FROM information_schema.role_table_grants 
            WHERE table_schema = 'testing' AND table_name = 'insumos_postventa';
        """)
        grants = cur.fetchall()
        for g in grants:
            print(f"  Grantee: {g[0]}, Privilege: {g[1]}")

        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
