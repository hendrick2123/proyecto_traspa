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

    query = """
        SELECT DISTINCT
            cc.id_cc,
            emp.id_empresa,
            cc.nombre_cc
        FROM testing.prof_centros_costo cc
        LEFT JOIN testing.prof_empresas emp
            ON cc.source = emp.source
        WHERE SUBSTRING(cc.id_cc FROM 1 FOR 3) IN (
            '112','212','312','412','512','612','712',
            '113','213','313','413','513','613','713',
            '118','218','318','418','518','618','718',
            '150','250','350','450','550','650','750'
        )
        ORDER BY cc.nombre_cc;
    """
    cur.execute(query)
    rows = cur.fetchall()
    print(f"Total rows fetched: {len(rows)}")
    for r in rows[:10]:
        print(r)

    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
