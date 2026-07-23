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
        UPDATE testing.detalle_traspaso_insumos_v2
        SET comentario_insumo = 'GARRUCHA'
        WHERE id_detalle = 959;
    """)
    
    conn.commit()
    print("Descripción (comentario_insumo) actualizada a 'GARRUCHA'.")

    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
