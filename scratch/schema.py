import db_config
conn = db_config.get_connection()
cur = conn.cursor()
cur.execute("""
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('solicitudes_traspasos_v2', 'Solicitud_traspasos')
""")
for row in cur.fetchall():
    print(row)
