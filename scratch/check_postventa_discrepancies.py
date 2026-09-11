from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        print("=== Checking insumos_postventa vs historial_postventa ===")
        cur.execute("SELECT id, descripcion, cantidad FROM testing.insumos_postventa ORDER BY id;")
        insumos = cur.fetchall()

        for i_id, desc, cant in insumos:
            cur.execute("""
                SELECT id_historial, cantidad_anterior, cantidad_agregada, salida, cantidad_total, orden_compra, fecha_movimiento
                FROM testing.historial_postventa
                WHERE id_insumo_pv = %s
                ORDER BY id_historial DESC LIMIT 1;
            """, (i_id,))
            last_hist = cur.fetchone()
            if last_hist:
                last_total = float(last_hist[4])
                current_cant = float(cant) if cant is not None else 0.0
                if last_total != current_cant:
                    print(f"Mismatch in insumo #{i_id} '{desc}': DB stock = {current_cant}, Last history total = {last_total}")
            else:
                current_cant = float(cant) if cant is not None else 0.0
                print(f"No history for insumo #{i_id} '{desc}': DB stock = {current_cant}")

        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
