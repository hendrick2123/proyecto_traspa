import sys
import os
import bcrypt
import db_config

def create_yazmin():
    conn = db_config.get_db_connection()
    cur = conn.cursor()
    
    nombre = "Yazmin Rodriguez Arroyo"
    correo = "yrodriguez@grupourbania.com"
    username = "yrodriguez"
    password = "Postventa2026"
    rol = "postventa"
    empresa_id = "98"
    cc_ids = "998"
    
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    
    cur.execute("SELECT id FROM testing.prof_usuarios WHERE username = %s OR correo = %s;", (username, correo))
    existing = cur.fetchone()
    
    if existing:
        cur.execute("""
            UPDATE testing.prof_usuarios
            SET nombre = %s, password = %s, rol = %s, empresa_id = %s, cc_ids = %s, activo = TRUE
            WHERE id = %s;
        """, (nombre, hashed, rol, empresa_id, cc_ids, existing[0]))
        print(f"Usuario {username} actualizado exitosamente con ID {existing[0]}")
    else:
        cur.execute("""
            INSERT INTO testing.prof_usuarios (nombre, correo, username, password, rol, empresa_id, cc_ids, activo)
            VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE)
            RETURNING id;
        """, (nombre, correo, username, hashed, rol, empresa_id, cc_ids))
        new_id = cur.fetchone()[0]
        print(f"Usuario {username} creado exitosamente con ID {new_id}")
        
    conn.commit()
    cur.close()
    conn.close()

if __name__ == "__main__":
    create_yazmin()
