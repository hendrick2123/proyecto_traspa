from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT DISTINCT empresa_origen FROM testing.solicitudes_traspasos_v2 ORDER BY empresa_origen;")
        print("Distinct empresa_origen in DB:")
        for r in cur.fetchall():
            print(" ", r)

        cur.execute("SELECT DISTINCT empresa_destino FROM testing.solicitudes_traspasos_v2 ORDER BY empresa_destino;")
        print("\nDistinct empresa_destino in DB:")
        for r in cur.fetchall():
            print(" ", r)

        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
