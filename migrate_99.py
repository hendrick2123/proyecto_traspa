import psycopg2
import sys
from server import get_db_connection

def migrate():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Add new columns to detalle_traspaso_insumos_v2
        cur.execute("ALTER TABLE testing.detalle_traspaso_insumos_v2 ADD COLUMN IF NOT EXISTS precio NUMERIC(12,4) DEFAULT 0;")
        cur.execute("ALTER TABLE testing.detalle_traspaso_insumos_v2 ADD COLUMN IF NOT EXISTS comentario_insumo TEXT DEFAULT '';")
        print("Columns precio and comentario_insumo added/verified.")

        # Check and insert Empresa 99
        cur.execute("SELECT id_empresa FROM testing.prof_empresas WHERE id_empresa = '99';")
        if not cur.fetchone():
            try:
                # We don't know the exact schema, so we'll try a minimal insert
                cur.execute("INSERT INTO testing.prof_empresas (id_empresa, nombre_empresa) VALUES ('99', 'Almacen');")
                print("Empresa 99 inserted.")
            except Exception as e:
                print(f"Could not insert Empresa 99: {e}")
                conn.rollback()
        
        # Check and insert CC 999
        cur.execute("SELECT id_cc FROM testing.prof_centros_costo WHERE id_cc = '999';")
        if not cur.fetchone():
            try:
                cur.execute("INSERT INTO testing.prof_centros_costo (id_cc, nombre_cc) VALUES ('999', 'Almacen');")
                print("CC 999 inserted.")
            except Exception as e:
                print(f"Could not insert CC 999: {e}")
                conn.rollback()

        conn.commit()
        cur.close()
        conn.close()
        print("Migration complete.")
    except Exception as e:
        print(f"Error during migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate()
