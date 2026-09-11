from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT h.id_historial, h.id_insumo_pv, 
                   COALESCE(i.descripcion, 'Desconocido') AS nombre_insumo,
                   COALESCE(CONCAT('PV-', i.id), '') AS clave,
                   h.cantidad_anterior, h.cantidad_agregada, h.salida, h.cantidad_total,
                   h.orden_compra, h.usuario, h.fecha_movimiento
            FROM testing.historial_postventa h
            LEFT JOIN testing.insumos_postventa i ON h.id_insumo_pv = i.id
            ORDER BY h.fecha_movimiento DESC;
        """)
        rows = cur.fetchall()
        print("API Query Result for /api/historial_postventa:")
        for r in rows:
            print(r)
        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
