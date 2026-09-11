from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Check existing history for insumo #36
        cur.execute("""
            SELECT id_historial, id_insumo_pv, cantidad_anterior, cantidad_agregada, salida, cantidad_total, orden_compra, usuario, fecha_movimiento
            FROM testing.historial_postventa
            WHERE id_insumo_pv = 36
            ORDER BY id_historial ASC;
        """)
        rows = cur.fetchall()
        print("Existing history rows for insumo #36:")
        for r in rows:
            print(r)

        # Insert missing movement of 4 items salida (14 -> 10)
        # Note: Previous row had total 44, if stock was updated to 14 previously, let's insert the salida of 4 to reach 10:
        cur.execute("""
            INSERT INTO testing.historial_postventa
                (id_insumo_pv, cantidad_anterior, cantidad_agregada, salida, cantidad_total, orden_compra, usuario, fecha_movimiento)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW());
        """, (36, 14.0, 0.0, 4.0, 10.0, 'SALIDA-POSTVENTA', 'Yazmin Rodriguez Arroyo'))

        conn.commit()
        print("\nInserted missing salida movement of 4 items for 'prueba 2'.")

        # Re-query history
        cur.execute("""
            SELECT h.id_historial, h.id_insumo_pv, i.descripcion, h.cantidad_anterior, h.cantidad_agregada, h.salida, h.cantidad_total, h.orden_compra, h.usuario, h.fecha_movimiento
            FROM testing.historial_postventa h
            LEFT JOIN testing.insumos_postventa i ON h.id_insumo_pv = i.id
            WHERE h.id_insumo_pv = 36
            ORDER BY h.id_historial DESC;
        """)
        print("\nUpdated history for 'prueba 2':")
        for r in cur.fetchall():
            print(r)

        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
