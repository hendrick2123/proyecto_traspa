import psycopg2

DB_CONFIG = {
    "host": "aws-1-us-east-1.pooler.supabase.com",
    "port": "6543",
    "dbname": "postgres",
    "user": "hendrick_user.vgxlpfsjruugrdiomjft",
    "password": "HendrickPostgresData2077!"
}

def test_lookup():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    insumo_id = "1180002"
    nombre = ""
    unidad = ""
    
    print("Testing lookup with:", insumo_id)
    cur.execute("SELECT descripcion, unidad FROM testing.prof_insumos_v2 WHERE insumo = %s LIMIT 1;", (insumo_id,))
    row = cur.fetchone()
    print("Row fetched:", row)
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    test_lookup()
