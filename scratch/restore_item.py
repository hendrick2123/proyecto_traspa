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
    
    # ID is 31 based on previous check
    id_solicitud = 31
    
    cur.execute("""
        INSERT INTO testing.detalle_traspaso_insumos_v2
            (id_solicitud, clave_insumo, nombre_insumo, cantidad, unidad, precio, comentario_insumo)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (
        id_solicitud, 
        '3030021', 
        'GARRUCHA', 
        2.0, 
        'PZA', 
        0.0, 
        'Restaurado de imagen original'
    ))
    
    conn.commit()
    print("Insumo GARRUCHA restaurado con éxito para id_solicitud 31.")
    
    # Verify
    cur.execute("SELECT id_detalle, clave_insumo, nombre_insumo, cantidad FROM testing.detalle_traspaso_insumos_v2 WHERE id_solicitud = %s", (id_solicitud,))
    items = cur.fetchall()
    print(f"Items actuales para {id_solicitud}: {items}")

    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
