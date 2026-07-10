import psycopg2

# Cargar DB_CONFIG de forma segura desde db_config.py
import sys
import os
# Agregar directorios para buscar db_config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from db_config import DB_CONFIG
except ImportError:
    DB_CONFIG = {}

try:
    print("Conectando a la base de datos...")
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()

    print("Conexión exitosa.\n")

    # =========================================
    # CREAR TABLA EN SCHEMA testing
    # =========================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS testing.hola_mundo (
            id SERIAL PRIMARY KEY,
            mensaje TEXT NOT NULL,
            fecha_creacion TIMESTAMP DEFAULT NOW()
        )
    """)

    print("Tabla creada correctamente.")

    # =========================================
    # INSERTAR HOLA MUNDO
    # =========================================
    cursor.execute("""
        INSERT INTO testing.hola_mundo (mensaje)
        VALUES ('Hola mundo desde Hendrick_user')
    """)

    print(f"Filas insertadas: {cursor.rowcount}")

    conn.commit()

    # =========================================
    # VERIFICAR CONTENIDO
    # =========================================
    cursor.execute("""
        SELECT *
        FROM testing.hola_mundo
        ORDER BY id DESC
        LIMIT 10
    """)

    rows = cursor.fetchall()

    print("\nContenido de la tabla:")
    for row in rows:
        print(row)

    # =========================================
    # CERRAR CONEXIÓN
    # =========================================
    cursor.close()
    conn.close()

    print("\nConexión cerrada.")

except Exception as e:
    print("Error en la conexión o query:")
    print(e)
