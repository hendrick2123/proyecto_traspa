import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from server import DB_CONFIG
import psycopg2

def create():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS testing.historial_postventa (
            id_historial SERIAL PRIMARY KEY,
            id_insumo_pv INT NOT NULL,
            cantidad_anterior NUMERIC(12,4) DEFAULT 0,
            cantidad_agregada NUMERIC(12,4) DEFAULT 0,
            salida NUMERIC(12,4) DEFAULT 0,
            cantidad_total NUMERIC(12,4) DEFAULT 0,
            orden_compra VARCHAR(100),
            usuario VARCHAR(100),
            fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    cur.close()
    conn.close()
    print("Tabla testing.historial_postventa creada exitosamente.")

if __name__ == "__main__":
    create()
