from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT id, username, nombre, rol, correo, password, activo, empresa_id, cc_ids FROM testing.prof_usuarios LIMIT 10;")
        for r in cur.fetchall():
            print(r)

        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
