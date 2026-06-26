import psycopg2

DB_CONFIG = {
    "host": "aws-1-us-east-1.pooler.supabase.com",
    "port": "6543",
    "dbname": "postgres",
    "user": "hendrick_user.vgxlpfsjruugrdiomjft",
    "password": "HendrickPostgresData2077!"
}

def inspect():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    # Get column datatypes
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'testing' AND table_name = 'prof_insumos_v2';
    """)
    cols = cur.fetchall()
    print("COLUMNS:")
    for col in cols:
        print(col)
        
    # Get sample rows
    cur.execute("""
        SELECT insumo, descripcion, unidad, tipo 
        FROM testing.prof_insumos_v2 
        LIMIT 5;
    """)
    rows = cur.fetchall()
    print("\nSAMPLE ROWS:")
    for row in rows:
        print(row)
        print(f"  insumo type: {type(row[0])}, len: {len(str(row[0])) if row[0] is not None else 0}")
        
    # Test query directly
    cur.execute("SELECT descripcion, unidad FROM testing.prof_insumos_v2 WHERE insumo = '1180002' LIMIT 1;")
    res = cur.fetchone()
    print(f"\nQUERY FOR '1180002': {res}")

    cur.execute("SELECT descripcion, unidad FROM testing.prof_insumos_v2 WHERE CAST(insumo AS TEXT) = '1180002' LIMIT 1;")
    res2 = cur.fetchone()
    print(f"QUERY WITH CAST: {res2}")

    cur.execute("SELECT descripcion, unidad FROM testing.prof_insumos_v2 WHERE TRIM(CAST(insumo AS TEXT)) = '1180002' LIMIT 1;")
    res3 = cur.fetchone()
    print(f"QUERY WITH TRIM & CAST: {res3}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    inspect()
