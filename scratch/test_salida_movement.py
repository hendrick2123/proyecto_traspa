from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Insumo ID 1 (LOSETA CERAMICA MOD. OXXUS GRIS)
        # Check current stock
        cur.execute("SELECT id, descripcion, cantidad FROM testing.insumos_postventa WHERE id = 1;")
        ins = cur.fetchone()
        print("Insumo actual:", ins)
        
        if ins:
            cant_ant = float(ins[2])
            salida_val = 5.0
            cant_tot = cant_ant - salida_val
            
            # Record a test salida in historial_postventa
            cur.execute("""
                INSERT INTO testing.historial_postventa
                    (id_insumo_pv, cantidad_anterior, cantidad_agregada, salida, cantidad_total, orden_compra, usuario)
                VALUES (%s, %s, 0, %s, %s, %s, %s);
            """, (1, cant_ant, salida_val, cant_tot, 'PRUEBA-SALIDA-OC', 'Sistema Test'))
            
            cur.execute("UPDATE testing.insumos_postventa SET cantidad = %s WHERE id = 1;", (cant_tot,))
            conn.commit()
            print(f"Salida de {salida_val} registrada con éxito. Nuevo stock: {cant_tot}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
