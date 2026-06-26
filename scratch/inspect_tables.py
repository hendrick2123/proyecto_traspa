import psycopg2

DB_CONFIG = {
    "host": "aws-1-us-east-1.pooler.supabase.com",
    "port": "6543",
    "dbname": "postgres",
    "user": "hendrick_user.vgxlpfsjruugrdiomjft",
    "password": "HendrickPostgresData2077!"
}

def main():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'testing' AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    """)
    tables = [r[0] for r in cur.fetchall()]
    print("Tables in testing schema:", tables)
    
    for t in tables:
        print(f"=== Columns in {t} ===")
        cur.execute(f"""
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'testing' AND table_name = '{t}'
            ORDER BY ordinal_position;
        """)
        for r in cur.fetchall():
            print(f"  {r[0]:30s} | {r[1]}")
        print()
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
