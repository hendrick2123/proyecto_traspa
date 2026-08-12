import os
import time
import sys
from db_config import get_db_connection_ctx
from app.core.config import EMPRESAS_DEFAULT, CC_DEFAULT, DESARROLLOS_DEFAULT, INSUMOS_DEFAULT

CATALOG_CACHE_TTL = int(os.environ.get("CATALOG_CACHE_TTL", 300))
CATALOG_CACHE = {
    "empresas": {"data": None, "ts": 0},
    "centros_costo": {"data": None, "ts": 0},
    "desarrollos": {"data": None, "ts": 0},
    "insumos": {"data": None, "ts": 0}
}

def _cache_get(key: str):
    entry = CATALOG_CACHE.get(key)
    if entry and entry["data"] is not None and (time.time() - entry["ts"]) < CATALOG_CACHE_TTL:
        return entry["data"]
    return None

def _cache_set(key: str, data):
    CATALOG_CACHE[key] = {"data": data, "ts": time.time()}

def invalidate_catalog_cache(key: str = None):
    if key:
        CATALOG_CACHE[key] = {"data": None, "ts": 0}
    else:
        for k in CATALOG_CACHE:
            CATALOG_CACHE[k] = {"data": None, "ts": 0}

def fetch_empresas():
    cached = _cache_get("empresas")
    if cached is not None:
        return cached
    try:
        with get_db_connection_ctx() as conn:
            cur = conn.cursor()
            cur.execute("SELECT id_empresa, nombre_empresa FROM testing.prof_empresas GROUP BY id_empresa, nombre_empresa ORDER BY CAST(id_empresa AS INTEGER);")
            rows = cur.fetchall()
            cur.close()
            lst = [{"id": r[0], "nombre": r[1], "rfc": ""} for r in rows] if rows else EMPRESAS_DEFAULT.copy()
            if not any(e["id"] == "99" for e in lst):
                lst.append({"id": "99", "nombre": "Almacen", "rfc": ""})
            _cache_set("empresas", lst)
            return lst
    except Exception as e:
        print(f"DB Warning empresas: {e}", file=sys.stderr, flush=True)
        _cache_set("empresas", EMPRESAS_DEFAULT)
        return EMPRESAS_DEFAULT

def fetch_centros_costo():
    cached = _cache_get("centros_costo")
    if cached is not None:
        return cached
    try:
        with get_db_connection_ctx() as conn:
            cur = conn.cursor()
            query = """
                SELECT DISTINCT
                    cc.id_cc,
                    emp.id_empresa,
                    cc.nombre_cc
                FROM testing.prof_centros_costo cc
                LEFT JOIN testing.prof_empresas emp
                    ON cc.source = emp.source
                WHERE SUBSTRING(cc.id_cc FROM 1 FOR 3) ~ '^[1-9A-Za-z](12|13|18|50)$'
                   OR cc.id_cc LIKE '900%'
                ORDER BY cc.nombre_cc;
            """
            cur.execute(query)
            rows = cur.fetchall()
            cur.close()
            lst = [{"id": r[0], "empresaId": r[1], "nombre": r[2], "direccion": ""} for r in rows] if rows else CC_DEFAULT.copy()
            if not any(c["id"] == "999" for c in lst):
                lst.append({"id": "999", "empresaId": "99", "nombre": "Almacen", "direccion": ""})
            _cache_set("centros_costo", lst)
            return lst
    except Exception as e:
        print(f"DB Warning centros_costo: {e}", file=sys.stderr, flush=True)
        _cache_set("centros_costo", CC_DEFAULT)
        return CC_DEFAULT

def fetch_desarrollos():
    cached = _cache_get("desarrollos")
    if cached is not None:
        return cached
    try:
        with get_db_connection_ctx() as conn:
            cur = conn.cursor()
            cur.execute("SELECT DISTINCT id_desarrollo, descripcion_desarrollo FROM testing.prof_desarrollos ORDER BY descripcion_desarrollo;")
            rows = cur.fetchall()
            cur.close()
            data = [{"id": r[0], "nombre": r[1]} for r in rows] if rows else DESARROLLOS_DEFAULT
            _cache_set("desarrollos", data)
            return data
    except Exception as e:
        print(f"DB Warning desarrollos: {e}", file=sys.stderr, flush=True)
        _cache_set("desarrollos", DESARROLLOS_DEFAULT)
        return DESARROLLOS_DEFAULT

def fetch_insumos():
    cached = _cache_get("insumos")
    if cached is not None:
        return cached
    try:
        with get_db_connection_ctx() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT DISTINCT ins.insumo, ins.descripcion, ins.unidad, ins.tipo
                FROM testing.prof_insumos_v2 ins
                ORDER BY ins.descripcion;
            """)
            rows = cur.fetchall()
            cur.close()
            data = [{"id": r[0], "clave": r[0], "nombre": r[1], "unidad": r[2] or "—", "categoria": r[3] or "Material"} for r in rows] if rows else INSUMOS_DEFAULT
            _cache_set("insumos", data)
            return data
    except Exception as e:
        print(f"DB Warning insumos: {e}", file=sys.stderr, flush=True)
        _cache_set("insumos", INSUMOS_DEFAULT)
        return INSUMOS_DEFAULT
