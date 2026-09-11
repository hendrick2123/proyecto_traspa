from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        print("=== Columns of solicitudes_traspasos_v2 ===")
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema='testing' AND table_name='solicitudes_traspasos_v2';
        """)
        for c in cur.fetchall():
            print(f"  {c[0]} ({c[1]})")

        print("\n=== Searching detalle_traspaso_insumos_v2 for 'prueba' ===")
        cur.execute("""
            SELECT d.id_detalle, d.id_solicitud, s.folio, s.solicitante, d.clave_insumo, d.nombre_insumo, d.cantidad, d.salida
            FROM testing.detalle_traspaso_insumos_v2 d
            LEFT JOIN testing.solicitudes_traspasos_v2 s ON d.id_solicitud = s.id_solicitud
            WHERE d.nombre_insumo LIKE '%prueba%' OR d.clave_insumo LIKE '%PV-36%' OR d.clave_insumo = '36';
        """)
        rows = cur.fetchall()
        print(f"Found {len(rows)} details:")
        for r in rows:
            print(r)

        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
