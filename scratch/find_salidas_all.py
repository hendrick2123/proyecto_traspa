from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT table_schema, table_name, column_name 
            FROM information_schema.columns 
            WHERE column_name LIKE '%salida%' 
               OR column_name LIKE '%egreso%'
               OR column_name LIKE '%resta%';
        """)
        cols = cur.fetchall()
        print("Columns found matching search:")
        for schema, table, col in cols:
            if schema in ('pg_catalog', 'information_schema'): continue
            try:
                cur.execute(f"SELECT count(*) FROM {schema}.{table} WHERE {col} IS NOT NULL AND {col} > 0;")
                cnt = cur.fetchone()[0]
                print(f" - {schema}.{table}.{col} -> {cnt} rows with > 0")
            except Exception as ex:
                print(f" - {schema}.{table}.{col} -> Error: {ex}")
                conn.rollback()

        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
