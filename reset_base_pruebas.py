"""
Script de Restauración de la Base de Pruebas (Sandbox Dev).
Sincroniza testing.dev_solicitudes_traspasos_v2 y testing.dev_detalle_traspaso_insumos_v2
con los datos actuales de producción en testing.solicitudes_traspasos_v2.
"""
import sys
import io
import psycopg2
from db_config import DB_CONFIG

# Forzar UTF-8 para consola Windows
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

def reset_dev_database():
    print("=" * 60)
    print("🔄 REINICIALIZANDO BASE DE DATOS DE PRUEBAS (SANDBOX DEV)")
    print("=" * 60)
    
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = False
    cur = conn.cursor()
    
    try:
        print("1. Limpiando tablas de desarrollo (dev_)...")
        cur.execute("TRUNCATE TABLE testing.dev_detalle_traspaso_insumos_v2 RESTART IDENTITY CASCADE;")
        cur.execute("TRUNCATE TABLE testing.dev_solicitudes_traspasos_v2 RESTART IDENTITY CASCADE;")
        
        print("2. Copiando solicitudes actuales de producción...")
        cur.execute("""
            INSERT INTO testing.dev_solicitudes_traspasos_v2
            SELECT * FROM testing.solicitudes_traspasos_v2;
        """)
        sol_count = cur.rowcount
        
        print("3. Copiando detalles de insumos actuales de producción...")
        cur.execute("""
            INSERT INTO testing.dev_detalle_traspaso_insumos_v2
            SELECT * FROM testing.detalle_traspaso_insumos_v2;
        """)
        det_count = cur.rowcount
        
        print("4. Sincronizando secuencias independientes de IDs...")
        cur.execute("""
            SELECT setval('testing.dev_solicitudes_id_seq', COALESCE((SELECT MAX(id_solicitud) FROM testing.dev_solicitudes_traspasos_v2), 1));
            SELECT setval('testing.dev_detalle_id_seq', COALESCE((SELECT MAX(id_detalle) FROM testing.dev_detalle_traspaso_insumos_v2), 1));
        """)
        
        conn.commit()
        print("=" * 60)
        print(f"✅ ÉXITO: Base de pruebas restaurada y sincronizada.")
        print(f"   • Solicitudes copiadas: {sol_count}")
        print(f"   • Detalles copiados:    {det_count}")
        print("=" * 60)
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al reiniciar base de pruebas: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    reset_dev_database()

