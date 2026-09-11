from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        print("=== Columns of testing.prof_usuarios ===")
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema='testing' AND table_name='prof_usuarios'
            ORDER BY ordinal_position;
        """)
        for c in cur.fetchall():
            print(f"  {c[0]} ({c[1]})")

        print("\n=== Existing users with postventa or admin role ===")
        cur.execute("SELECT id, username, nombre, rol, email, activo FROM testing.prof_usuarios WHERE rol IN ('postventa', 'administrador') OR nombre LIKE '%Yazmin%' LIMIT 10;")
        for r in cur.fetchall():
            print(r)

        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
