from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # 1. Catch up the current missing movement for insumo #36 (10 -> 8)
        cur.execute("""
            SELECT cantidad_total FROM testing.historial_postventa 
            WHERE id_insumo_pv = 36 
            ORDER BY id_historial DESC LIMIT 1;
        """)
        last_total = float(cur.fetchone()[0])
        print(f"Last recorded history total for insumo #36: {last_total}")

        cur.execute("SELECT cantidad FROM testing.insumos_postventa WHERE id = 36;")
        curr_stock = float(cur.fetchone()[0])
        print(f"Current actual stock in insumos_postventa for insumo #36: {curr_stock}")

        if last_total != curr_stock:
            salida_diff = last_total - curr_stock
            print(f"Catching up missing salida of {salida_diff} (from {last_total} to {curr_stock})...")
            cur.execute("""
                INSERT INTO testing.historial_postventa
                    (id_insumo_pv, cantidad_anterior, cantidad_agregada, salida, cantidad_total, orden_compra, usuario, fecha_movimiento)
                VALUES (%s, %s, 0, %s, %s, %s, %s, NOW());
            """, (36, last_total, salida_diff, curr_stock, 'Salida Externa', 'Sistema Externe'))
            print("Missing movement inserted!")

        # 2. Create automatic trigger in PostgreSQL
        trigger_sql = """
        CREATE OR REPLACE FUNCTION testing.trg_auto_historial_insumos_postventa()
        RETURNS TRIGGER AS $$
        DECLARE
            diff NUMERIC;
        BEGIN
            IF (OLD.cantidad IS DISTINCT FROM NEW.cantidad) THEN
                diff := NEW.cantidad - OLD.cantidad;
                IF diff < 0 THEN
                    INSERT INTO testing.historial_postventa
                        (id_insumo_pv, cantidad_anterior, cantidad_agregada, salida, cantidad_total, orden_compra, usuario, fecha_movimiento)
                    VALUES
                        (NEW.id, OLD.cantidad, 0, ABS(diff), NEW.cantidad, 'Salida Externa', 'Sistema', NOW());
                ELSIF diff > 0 THEN
                    INSERT INTO testing.historial_postventa
                        (id_insumo_pv, cantidad_anterior, cantidad_agregada, salida, cantidad_total, orden_compra, usuario, fecha_movimiento)
                    VALUES
                        (NEW.id, OLD.cantidad, diff, 0, NEW.cantidad, 'Entrada Externa', 'Sistema', NOW());
                END IF;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trg_insumos_postventa_historial ON testing.insumos_postventa;

        CREATE TRIGGER trg_insumos_postventa_historial
        AFTER UPDATE OF cantidad ON testing.insumos_postventa
        FOR EACH ROW
        EXECUTE FUNCTION testing.trg_auto_historial_insumos_postventa();
        """

        cur.execute(trigger_sql)
        conn.commit()
        print("PostgreSQL Trigger 'trg_insumos_postventa_historial' created successfully!")

        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
