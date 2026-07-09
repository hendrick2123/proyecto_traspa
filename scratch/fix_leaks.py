import re

file_path = r"c:\Users\Ramses Obregon\Desktop\Proyectos\proyecto_traspa\server_fastapi.py"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix save_db_traspaso
content = content.replace(
"""        if conn:
            try: conn.rollback()
            except Exception: pass
        return None""",
"""        if conn:
            try: conn.rollback()
            except Exception: pass
            if close_conn:
                try: conn.close()
                except Exception: pass
        return None"""
)

# Fix get_max_folio_number
content = content.replace(
"""    except Exception as e:
        print(f"DB Error get_max_folio_number: {e}", file=sys.stderr, flush=True)
        return 0""",
"""    except Exception as e:
        print(f"DB Error get_max_folio_number: {e}", file=sys.stderr, flush=True)
        if close_conn and 'conn' in locals() and conn:
            try: conn.close()
            except: pass
        return 0"""
)

# Fix get_db_traspasos_paginated
content = content.replace(
"""    except Exception as e:
        print(f"DB Warning get_db_traspasos_paginated: {e}", file=sys.stderr, flush=True)
        return [], 0""",
"""    except Exception as e:
        print(f"DB Warning get_db_traspasos_paginated: {e}", file=sys.stderr, flush=True)
        if 'conn' in locals() and conn:
            try: conn.close()
            except: pass
        return [], 0"""
)

# Fix catalogs
for cat in ["empresas", "centros_costo", "desarrollos", "insumos"]:
    content = re.sub(
        rf"(    except Exception as e:\n        print\(f\"DB Warning {cat}: {{e}}\", file=sys\.stderr, flush=True\)\n        CATALOG_CACHE\[\"{cat}\"\] = [^\n]+\n        return [^\n]+)",
        r"        if 'conn' in locals() and conn:\n            try: conn.close()\n            except: pass\n\1",
        content
    )

# Fix auth/user methods
user_methods = [
    r"DB Error auth:",
    r"DB Error register:",
    r"DB Error update user:",
    r"DB Error delete user:",
    r"DB Error fetch users:",
]
for u_err in user_methods:
    # find except Exception as e: print(f"DB Error ...: {e}"... and inject close
    content = re.sub(
        rf"(    except Exception as e:\n        print\(f\"{u_err} {{e}}\", file=sys\.stderr, flush=True\))",
        rf"\1\n        if 'conn' in locals() and conn:\n            try: conn.close()\n            except: pass",
        content
    )

# Fix api_login exception
content = content.replace(
"""    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    if not row:""",
"""    except Exception as e:
        if 'conn' in locals() and conn:
            try: conn.close()
            except: pass
        raise HTTPException(status_code=500, detail=str(e))
    if not row:"""
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Leaks fixed.")
