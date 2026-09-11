from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        print("=== Schema of solicitudes_traspasos_v2 ===")
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema='testing' AND table_name='solicitudes_traspasos_v2';
        """)
        for c in cur.fetchall():
            print(f"  {c[0]} ({c[1]})")

        print("\n=== Schema of detalle_traspaso_insumos_v2 ===")
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema='testing' AND table_name='detalle_traspaso_insumos_v2';
        """)
        for c in cur.fetchall():
            print(f"  {c[0]} ({c[1]})")

        print("\n=== Checking if any rows in detalle_traspaso_insumos_v2 have salida > 0 ===")
        cur.execute("SELECT count(*) FROM testing.detalle_traspaso_insumos_v2 WHERE salida IS NOT NULL AND salida > 0;")
        cnt = cur.fetchone()[0]
        print("Rows with salida > 0 in detalle_traspaso_insumos_v2:", cnt)

        print("\n=== Checking sample rows in detalle_traspaso_insumos_v2 ===")
        cur.execute("""
            SELECT d.id_detalle, d.id_solicitud, s.folio, s.solicitante, s.fecha_solicitud, d.clave_insumo, d.nombre_insumo, d.cantidad, d.salida
            FROM testing.detalle_traspaso_insumos_v2 d
            LEFT JOIN testing.solicitudes_traspasos_v2 s ON d.id_solicitud = s.id_solicitud
            LIMIT 10;
        """)
        for r in cur.fetchall():
            print(r)

        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
