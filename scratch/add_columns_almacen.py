import sys
from db_config import get_db_connection

def add_columns():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database.")
        sys.exit(1)
        
    try:
        cur = conn.cursor()
        print("Adding column 'salida'...")
        cur.execute("ALTER TABLE testing.detalle_traspaso_insumos_v2 ADD COLUMN IF NOT EXISTS salida NUMERIC(12,4) DEFAULT 0;")
        
        print("Adding column 'total'...")
        # Since quantity and salida are both NUMERIC, their subtraction is NUMERIC.
        cur.execute("ALTER TABLE testing.detalle_traspaso_insumos_v2 ADD COLUMN IF NOT EXISTS total NUMERIC(12,4) GENERATED ALWAYS AS (cantidad - COALESCE(salida, 0)) STORED;")
        
        conn.commit()
        cur.close()
        print("Columns added successfully.")
    except Exception as e:
        print(f"Error: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    add_columns()
