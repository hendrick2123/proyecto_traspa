from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        print("=== Test updating stock from 8 to 6 directly on testing.insumos_postventa ===")
        cur.execute("UPDATE testing.insumos_postventa SET cantidad = 6 WHERE id = 36;")
        conn.commit()

        print("=== Querying historial_postventa for insumo #36 ===")
        cur.execute("""
            SELECT id_historial, id_insumo_pv, cantidad_anterior, cantidad_agregada, salida, cantidad_total, orden_compra, usuario, fecha_movimiento
            FROM testing.historial_postventa
            WHERE id_insumo_pv = 36
            ORDER BY id_historial DESC LIMIT 5;
        """)
        for r in cur.fetchall():
            print(r)

        # Restore back to 8 for user's consistency
        cur.execute("UPDATE testing.insumos_postventa SET cantidad = 8 WHERE id = 36;")
        # Remove test entry created during this test
        cur.execute("DELETE FROM testing.historial_postventa WHERE id_insumo_pv = 36 AND salida = 2 AND cantidad_total = 6;")
        conn.commit()
        print("\nTest completed successfully and test state restored back to 8!")

        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
