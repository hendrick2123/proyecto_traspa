import os, psycopg2

DB_HOST = os.getenv("DB_HOST", "aws-1-us-east-1.pooler.supabase.com")
DB_PORT = int(os.getenv("DB_PORT", "6543"))
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "hendrick_user.vgxlpfsjruugrdiomjft")
DB_PASSWORD = os.getenv("DB_PASSWORD", "HendrickPostgresData2077!")

updates = {
    13: ("LOSETA CERAMICA TIPO TIMBERWOOD CAFÉ", "PZA", "CERAMICO"),
    18: ("EXTENSIÓN NARANJA 10 MTS", "PZA", "MATERIAL"),
    23: ("SILICÓN TRANSPARENTE", "PZA", "MATERIAL"),
    24: ("SILICÓN BCO PINTABLE", "PZA", "MATERIAL"),
    31: ("SILICÓN NEGRO", "PZA", "MATERIAL"),
    32: ("SILICÓN PUERTAS Y VENTANAS", "PZA", "MATERIAL"),
    33: ("SILICÓN TRANSPARENTE", "PZA", "MATERIAL"),
}

conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD)
conn.set_client_encoding('UTF8')
cur = conn.cursor()

for item_id, (desc, unit, esp) in updates.items():
    cur.execute(
        "UPDATE testing.insumos_postventa SET descripcion = %s, unidad = %s, especialidad = %s WHERE id = %s;",
        (desc, unit, esp, item_id)
    )

conn.commit()
cur.close()
conn.close()
print("Clean UTF-8 updates committed successfully.")
