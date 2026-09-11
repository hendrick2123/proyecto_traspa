from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        print("=== Checking insumos_postventa for 'prueba 2' or quantity 8 ===")
        cur.execute("SELECT id, descripcion, cantidad FROM testing.insumos_postventa WHERE id = 36 OR descripcion LIKE '%prueba%' OR cantidad = 8;")
        rows = cur.fetchall()
        for r in rows:
            print("  insumos_postventa:", r)

        print("\n=== Checking detalle_traspaso_insumos_v2 for salida = 2 or cantidad = 8 or salida > 0 ===")
        cur.execute("SELECT id_detalle, id_solicitud, clave_insumo, nombre_insumo, cantidad, salida FROM testing.detalle_traspaso_insumos_v2 WHERE salida > 0 OR cantidad = 8 OR clave_insumo = '36' OR nombre_insumo LIKE '%prueba%';")
        rows = cur.fetchall()
        print(f"Found {len(rows)} matching rows in detalle_traspaso_insumos_v2:")
        for r in rows:
            print("  detalle_traspaso_insumos_v2:", r)

        print("\n=== Checking ALL tables for columns named 'salida' or value 8 / 2 ===")
        cur.execute("""
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'testing';
        """)
        all_cols = cur.fetchall()
        
        # Check tables that have 'salida' column
        tables_with_salida = set(t for t, c in all_cols if 'salida' in c.lower())
        print("Tables with a 'salida' column:", tables_with_salida)

        for t in tables_with_salida:
            try:
                cur.execute(f"SELECT * FROM testing.{t} WHERE salida > 0 LIMIT 10;")
                res = cur.fetchall()
                print(f"  Rows with salida > 0 in testing.{t}:", res)
            except Exception as ex:
                conn.rollback()
                print(f"  Error checking testing.{t}:", ex)

        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
