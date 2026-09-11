from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM testing.historial_postventa WHERE id_historial = 7;")
        conn.commit()
        print("Cleaned up test row 7.")
        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
