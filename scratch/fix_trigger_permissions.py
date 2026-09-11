from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Grant permissions to PUBLIC on testing schema
        grant_sql = """
        GRANT USAGE ON SCHEMA testing TO PUBLIC;
        GRANT ALL ON ALL TABLES IN SCHEMA testing TO PUBLIC;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA testing TO PUBLIC;
        """
        cur.execute(grant_sql)

        # Create trigger with SECURITY DEFINER and EXCEPTION handler so it NEVER blocks updates
        trigger_sql = """
        CREATE OR REPLACE FUNCTION testing.trg_auto_historial_insumos_postventa()
        RETURNS TRIGGER 
        SECURITY DEFINER
        AS $$
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
        EXCEPTION WHEN OTHERS THEN
            -- Safe fallback: Never interrupt or block any update from external systems
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
        print("Permissions granted and Trigger updated with SECURITY DEFINER and EXCEPTION safety block!")

        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
