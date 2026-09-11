from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT salida, COUNT(*) 
            FROM testing.detalle_traspaso_insumos_v2 
            GROUP BY salida 
            LIMIT 20;
        """)
        rows = cur.fetchall()
        print("Distinct values of salida:")
        for r in rows:
            print(f"  Salida: {r[0]} -> Count: {r[1]}")

        cur.execute("""
            SELECT id_detalle, id_solicitud, clave_insumo, nombre_insumo, cantidad, salida
            FROM testing.detalle_traspaso_insumos_v2
            WHERE salida IS NOT NULL
            LIMIT 10;
        """)
        print("\nSample rows:")
        for r in cur.fetchall():
            print(r)

        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
