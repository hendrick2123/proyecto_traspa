from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        query = """
            SELECT 
                h.id_historial, 
                h.id_insumo_pv, 
                COALESCE(i.descripcion, 'Desconocido') AS nombre_insumo,
                COALESCE(CONCAT('PV-', i.id), '') AS clave,
                h.cantidad_anterior, 
                h.cantidad_agregada, 
                h.salida, 
                h.cantidad_total,
                h.orden_compra, 
                h.usuario, 
                h.fecha_movimiento
            FROM testing.historial_postventa h
            LEFT JOIN testing.insumos_postventa i ON h.id_insumo_pv = i.id

            UNION ALL

            SELECT 
                d.id_detalle AS id_historial,
                NULL AS id_insumo_pv,
                d.nombre_insumo,
                d.clave_insumo AS clave,
                d.cantidad AS cantidad_anterior,
                0 AS cantidad_agregada,
                COALESCE(d.salida, 0) AS salida,
                (d.cantidad - COALESCE(d.salida, 0)) AS cantidad_total,
                s.folio AS orden_compra,
                s.solicitante AS usuario,
                s.fecha_solicitud AS fecha_movimiento
            FROM testing.detalle_traspaso_insumos_v2 d
            JOIN testing.solicitudes_traspasos_v2 s ON d.id_solicitud = s.id_solicitud
            WHERE d.salida IS NOT NULL AND d.salida > 0

            ORDER BY fecha_movimiento DESC;
        """
        cur.execute(query)
        rows = cur.fetchall()
        print(f"Total Combined History Records: {len(rows)}")
        for r in rows:
            print(r)

        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
