from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Test exact match (what was happening before)
        cur.execute("SELECT count(*) FROM testing.solicitudes_traspasos_v2 WHERE (cc_origen = '412' OR cc_destino = '412');")
        exact_cnt = cur.fetchone()[0]
        print("Exact match count for cc='412':", exact_cnt)

        # Test prefix / pattern match (LIKE '412%')
        cur.execute("SELECT count(*) FROM testing.solicitudes_traspasos_v2 WHERE (cc_origen = '412' OR cc_origen LIKE '412%' OR cc_destino = '412' OR cc_destino LIKE '412%');")
        pattern_cnt = cur.fetchone()[0]
        print("Pattern match (LIKE '412%') count:", pattern_cnt)

        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
