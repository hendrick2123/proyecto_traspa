from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id_detalle, id_solicitud, clave_insumo, nombre_insumo, cantidad, salida
            FROM testing.detalle_traspaso_insumos_v2
            WHERE salida IS NOT NULL AND salida > 0
            LIMIT 20;
        """)
        rows = cur.fetchall()
        print(f"Total registros con salida > 0: {len(rows)}")
        for r in rows:
            print(f"Detalle: {r[0]}, Solicitud: {r[1]}, Clave: {r[2]}, Nombre: {r[3]}, Cantidad: {r[4]}, Salida: {r[5]}")

        cur.execute("SELECT count(*) FROM testing.detalle_traspaso_insumos_v2 WHERE salida IS NOT NULL;")
        count_not_null = cur.fetchone()[0]
        print(f"Total registros con salida NOT NULL: {count_not_null}")
        
        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
