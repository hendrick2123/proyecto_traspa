from db_config import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        print("Testing update operation on insumos_postventa...")
        cur.execute("UPDATE testing.insumos_postventa SET cantidad = 8 WHERE id = 36;")
        conn.commit()
        print("Update executed cleanly without errors!")

        cur.close()
        conn.close()
    except Exception as e:
        print("Error during update:", e)

if __name__ == '__main__':
    main()
