import psycopg2
from dotenv import load_dotenv
import os

load_dotenv('.env')

def main():
    conn = psycopg2.connect(
        dbname=os.environ.get('DB_NAME', 'traspa'),
        user=os.environ.get('DB_USER', 'postgres'),
        password=os.environ.get('DB_PASSWORD', 'postgres'),
        host=os.environ.get('DB_HOST', 'localhost')
    )
    cur = conn.cursor()
    
    cur.execute("""
        SELECT id_solicitud, folio, solicitante, observaciones 
        FROM testing.solicitudes_traspasos_v2 
        WHERE observaciones LIKE '%Recreado tras borrado accidental%'
    """)
    rows = cur.fetchall()
    print("Solicitudes:")
    for r in rows:
        print(f"ID: {r[0]}, Folio: {r[1]}, Solicitante: {r[2]}, Obs: {r[3]}")
        
        # Check items
        cur.execute("SELECT id_detalle, clave_insumo, nombre_insumo, cantidad FROM testing.detalle_traspaso_insumos_v2 WHERE id_solicitud = %s", (r[0],))
        items = cur.fetchall()
        print(f"  Items for {r[0]}: {items}")

    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
