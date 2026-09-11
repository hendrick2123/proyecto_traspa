import bcrypt
from db_config import get_db_connection

def create_postventa_users():
    conn = get_db_connection()
    cur = conn.cursor()
    
    users = [
        {
            "nombre": "Nuria Ruíz Contreras",
            "correo": "nruiz@grupourbania.com",
            "username": "nruiz",
            "password": "Postventa2026",
            "rol": "postventa",
            "empresa_id": "98",
            "cc_ids": "998"
        },
        {
            "nombre": "Martha Iliana Villeda Cabrera",
            "correo": "mvilleda@grupourbania.com",
            "username": "mvilleda",
            "password": "Postventa2026",
            "rol": "postventa",
            "empresa_id": "98",
            "cc_ids": "998"
        }
    ]

    for u in users:
        hashed = bcrypt.hashpw(u["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        
        cur.execute("SELECT id FROM testing.prof_usuarios WHERE username = %s OR correo = %s OR nombre = %s;", (u["username"], u["correo"], u["nombre"]))
        existing = cur.fetchone()
        
        if existing:
            cur.execute("""
                UPDATE testing.prof_usuarios
                SET nombre = %s, correo = %s, username = %s, password = %s, rol = %s, empresa_id = %s, cc_ids = %s, activo = TRUE
                WHERE id = %s;
            """, (u["nombre"], u["correo"], u["username"], hashed, u["rol"], u["empresa_id"], u["cc_ids"], existing[0]))
            print(f"Usuario '{u['nombre']}' ({u['username']}) actualizado exitosamente con ID {existing[0]}")
        else:
            cur.execute("""
                INSERT INTO testing.prof_usuarios (nombre, correo, username, password, rol, empresa_id, cc_ids, activo, creado_en)
                VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE, NOW())
                RETURNING id;
            """, (u["nombre"], u["correo"], u["username"], hashed, u["rol"], u["empresa_id"], u["cc_ids"]))
            new_id = cur.fetchone()[0]
            print(f"Usuario '{u['nombre']}' ({u['username']}) creado exitosamente con ID {new_id}")

    conn.commit()
    cur.close()
    conn.close()

if __name__ == "__main__":
    create_postventa_users()
