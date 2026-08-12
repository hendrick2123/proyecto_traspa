"""
Diagnóstico y corrección de login.
Este script:
1. Muestra los usuarios en la BD y su formato de hash
2. Verifica si la contraseña ingresada coincide
3. Opcionalmente, restablece la contraseña al valor correcto
"""
import sys
import os
import hashlib
import bcrypt

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db_config import DB_CONFIG
import psycopg2

def hash_legacy(password: str) -> str:
    salted = "gu_salt_2026_" + password
    return hashlib.sha256(salted.encode("utf-8")).hexdigest()

def verify_bcrypt(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception as e:
        print(f"  [ERROR bcrypt] {e}")
        return False

def hash_bcrypt(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def main():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # ── 1. Mostrar todos los usuarios ──────────────────────────────────────────
    cur.execute("""
        SELECT id, nombre, username, rol, activo, 
               LEFT(password, 10) AS hash_preview,
               LENGTH(password) AS hash_len,
               password
        FROM testing.prof_usuarios ORDER BY id;
    """)
    rows = cur.fetchall()

    print("=" * 70)
    print("USUARIOS EN LA BASE DE DATOS:")
    print("=" * 70)
    for r in rows:
        fmt = "BCRYPT" if r[7] and r[7].startswith("$2") else "SHA-256 o TEXTO PLANO"
        print(f"  ID={r[0]}  username='{r[2]}'  nombre='{r[1]}'  rol={r[3]}  activo={r[4]}")
        print(f"    hash_format={fmt}  len={r[6]}  preview='{r[5]}...'")
    print()

    # ── 2. Probar credenciales específicas ─────────────────────────────────────
    TARGET_USERNAME = "Hendrick"
    TEST_PASSWORDS  = ["UWU123", "uwu123", "Uwu123", "UWU1234", "admin123"]

    cur.execute("""
        SELECT id, nombre, username, password, activo
        FROM testing.prof_usuarios WHERE username = %s
    """, (TARGET_USERNAME,))
    row = cur.fetchone()

    print("=" * 70)
    if not row:
        print(f"⚠️  Usuario '{TARGET_USERNAME}' NO encontrado en la BD.")
        print("     Prueba con username exacto (mayúsculas/minúsculas importan).")
        
        # Buscar similar
        cur.execute("""
            SELECT username FROM testing.prof_usuarios 
            WHERE LOWER(username) = LOWER(%s)
        """, (TARGET_USERNAME,))
        similares = cur.fetchall()
        if similares:
            print(f"     → Usuarios con nombre similar: {[s[0] for s in similares]}")
    else:
        uid, nombre, username, stored_hash, activo = row
        print(f"✅ Usuario encontrado: id={uid}  nombre='{nombre}'  activo={activo}")
        is_bcrypt = stored_hash and stored_hash.startswith("$2")
        fmt = "BCRYPT" if is_bcrypt else "SHA-256/otro"
        print(f"   Hash format: {fmt}  (len={len(stored_hash) if stored_hash else 0})")
        print()

        print("VERIFICANDO CONTRASEÑAS:")
        for pwd in TEST_PASSWORDS:
            if is_bcrypt:
                ok = verify_bcrypt(pwd, stored_hash)
            else:
                ok = (stored_hash == hash_legacy(pwd))
            status = "✅ COINCIDE" if ok else "❌ no coincide"
            print(f"   '{pwd}' → {status}")

    print("=" * 70)

    # ── 3. Preguntar si se quiere restablecer la contraseña ───────────────────
    print()
    answer = input("¿Deseas RESTABLECER la contraseña de un usuario? (s/n): ").strip().lower()
    if answer == "s":
        uname = input("  Username exacto (ej. Hendrick): ").strip()
        newpwd = input("  Nueva contraseña: ").strip()
        
        cur.execute("SELECT id FROM testing.prof_usuarios WHERE username = %s", (uname,))
        u = cur.fetchone()
        if not u:
            print(f"❌ Usuario '{uname}' no encontrado.")
        else:
            new_hash = hash_bcrypt(newpwd)
            cur.execute(
                "UPDATE testing.prof_usuarios SET password = %s WHERE username = %s",
                (new_hash, uname)
            )
            conn.commit()
            print(f"✅ Contraseña de '{uname}' actualizada correctamente a bcrypt.")
            print(f"   Ahora puedes ingresar con: username='{uname}' password='{newpwd}'")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
