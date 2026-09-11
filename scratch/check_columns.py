from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema='testing' AND table_name='detalle_traspaso_insumos_v2' 
            ORDER BY ordinal_position;
        """)
        columns = cur.fetchall()
        print("Columns in testing.detalle_traspaso_insumos_v2:")
        for col in columns:
            print(f" - {col[0]} ({col[1]}, nullable: {col[2]})")
        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
