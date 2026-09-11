from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        print("=== Current status of insumo #36 in insumos_postventa ===")
        cur.execute("SELECT id, descripcion, cantidad FROM testing.insumos_postventa WHERE id = 36;")
        ins = cur.fetchone()
        print("insumos_postventa:", ins)

        print("\n=== Current history rows for insumo #36 in historial_postventa ===")
        cur.execute("""
            SELECT id_historial, id_insumo_pv, cantidad_anterior, cantidad_agregada, salida, cantidad_total, orden_compra, usuario, fecha_movimiento
            FROM testing.historial_postventa
            WHERE id_insumo_pv = 36
            ORDER BY id_historial ASC;
        """)
        for r in cur.fetchall():
            print("historial_postventa:", r)

        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
