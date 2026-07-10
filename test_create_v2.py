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
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    print("Conexion exitosa\n")

    # Intentar crear tabla solicitudes v2
    cur.execute("""
        CREATE TABLE IF NOT EXISTS testing.solicitudes_traspasos_v2 (
            id_solicitud SERIAL PRIMARY KEY,                  
            folio VARCHAR(50) NOT NULL UNIQUE,                
            tipo_traspaso VARCHAR(50) NOT NULL,               
            solicitante VARCHAR(100) NOT NULL,                
            estado VARCHAR(30) DEFAULT 'PENDIENTE AUTH.',     
            empresa_origen VARCHAR(100) NULL,
            empresa_destino VARCHAR(100) NULL,
            cc_origen VARCHAR(150) NOT NULL,                  
            cc_destino VARCHAR(150) NOT NULL,                 
            fecha_solicitud TIMESTAMP NOT NULL,                     
            observaciones TEXT NULL,
            autorizador VARCHAR(100) NULL,
            fecha_autorizacion TIMESTAMP NULL,
            comentario_auth TEXT NULL,
            receptor VARCHAR(100) NULL,
            fecha_recepcion TIMESTAMP NULL,
            comentario_rec TEXT NULL
        );
    """)
    print("Tabla solicitudes_traspasos_v2 creada.")

    # Intentar crear tabla detalles v2
    cur.execute("""
        CREATE TABLE IF NOT EXISTS testing.detalle_traspaso_insumos_v2 (
            id_detalle SERIAL PRIMARY KEY,                    
            id_solicitud INT NOT NULL,                        
            clave_insumo VARCHAR(50) NOT NULL,                
            nombre_insumo VARCHAR(150) NOT NULL,              
            cantidad NUMERIC(12, 4) NOT NULL,
            unidad VARCHAR(20) NOT NULL,                      
            CONSTRAINT fk_solicitud
                FOREIGN KEY (id_solicitud) 
                REFERENCES testing.solicitudes_traspasos_v2(id_solicitud) 
                ON DELETE CASCADE
        );
    """)
    print("Tabla detalle_traspaso_insumos_v2 creada.")

    # Test INSERT y SELECT
    cur.execute("""
        INSERT INTO testing.solicitudes_traspasos_v2 
            (folio, tipo_traspaso, solicitante, cc_origen, cc_destino, fecha_solicitud)
        VALUES ('TEST-V2-001', 'PRS', 'Tester', 'CC1', 'CC2', NOW())
        RETURNING id_solicitud;
    """)
    sol_id = cur.fetchone()[0]
    print(f"INSERT en solicitudes_traspasos_v2 exitoso! id={sol_id}")

    cur.execute("""
        INSERT INTO testing.detalle_traspaso_insumos_v2
            (id_solicitud, clave_insumo, nombre_insumo, cantidad, unidad)
        VALUES (%s, %s, %s, %s, %s);
    """, (sol_id, 'INS-001', 'Cemento', 1.5, 'Bulto'))
    print("INSERT float en detalle_traspaso_insumos_v2 exitoso!")

    # Limpiar
    cur.execute('DELETE FROM testing.solicitudes_traspasos_v2 WHERE id_solicitud = %s;', (sol_id,))
    conn.commit()
    print("Limpieza completada.")

    cur.close()
    conn.close()

except Exception as e:
    print(f"ERROR: {e}")
