from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT id_solicitud, folio, cc_origen, cc_destino, empresa_origen, empresa_destino FROM testing.solicitudes_traspasos_v2 LIMIT 25;")
        rows = cur.fetchall()
        print("Sample cc_origen and cc_destino values in solicitudes_traspasos_v2:")
        for r in rows:
            print(f"ID: {r[0]} | Folio: {r[1]} | cc_origen: '{r[2]}' | cc_destino: '{r[3]}' | emp_ori: '{r[4]}' | emp_des: '{r[5]}'")

        print("\nSearching for any row with 412 in cc_origen or cc_destino or folio:")
        cur.execute("SELECT id_solicitud, folio, cc_origen, cc_destino FROM testing.solicitudes_traspasos_v2 WHERE cc_origen LIKE '%412%' OR cc_destino LIKE '%412%';")
        for r in cur.fetchall():
            print("Match 412:", r)

        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
