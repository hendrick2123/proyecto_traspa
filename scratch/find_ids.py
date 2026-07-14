import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db_config import get_db_connection

conn = get_db_connection()
cur = conn.cursor()

cur.execute("SELECT id_empresa, nombre_empresa FROM testing.prof_empresas WHERE nombre_empresa ILIKE '%DESARROLLADORA%' OR nombre_empresa ILIKE '%MARGOPH%'")
print('EMPRESAS:', cur.fetchall())

cur.execute("SELECT id_cc, nombre_cc FROM testing.prof_centros_costo WHERE nombre_cc ILIKE '%JAMAICA PARK%' OR nombre_cc ILIKE '%FLORESTA 2%'")
print('CENTROS DE COSTO:', cur.fetchall())
