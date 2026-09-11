from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT count(*) FROM testing.historial_postventa;")
        total = cur.fetchone()[0]
        print(f"Total rows in historial_postventa: {total}")

        cur.execute("SELECT count(*) FROM testing.historial_postventa WHERE salida IS NOT NULL AND salida > 0;")
        salida_gt_0 = cur.fetchone()[0]
        print(f"Total rows in historial_postventa with salida > 0: {salida_gt_0}")

        cur.execute("""
            SELECT hp.id_historial, hp.id_insumo_pv, ip.descripcion, hp.cantidad_anterior, hp.cantidad_agregada, hp.salida, hp.cantidad_total, hp.orden_compra, hp.usuario, hp.fecha_movimiento
            FROM testing.historial_postventa hp
            LEFT JOIN testing.insumos_postventa ip ON hp.id_insumo_pv = ip.id
            ORDER BY hp.id_historial DESC
            LIMIT 20;
        """)
        rows = cur.fetchall()
        print("\nLatest 20 movements in historial_postventa:")
        for r in rows:
            print(r)

        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
