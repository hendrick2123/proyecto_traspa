import json
import os
import sys
import hashlib
import bcrypt
import re
import time
import uuid
import base64
import urllib.request
import urllib.parse
import psycopg2

from contextlib import asynccontextmanager
from typing import Optional, Any

from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

PORT = 8000
FRONTEND_DIR = "frontend"
DB_FILE = "db.json"

from db_config import DB_CONFIG, get_db_connection

PORT = int(os.environ.get("PORT", 8000))

CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in os.environ.get(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:8000,http://127.0.0.1:8000,null"
    ).split(",")
]

GEO_RESTRICTION_ENABLED  = os.environ.get("GEO_RESTRICTION_ENABLED", "true").lower() == "true"
GEO_ALLOWED_CITY         = os.environ.get("GEO_ALLOWED_CITY", "Mexico City")
GEO_ALLOWED_COUNTRY      = os.environ.get("GEO_ALLOWED_COUNTRY", "Mexico")
GEO_CACHE_TTL            = int(os.environ.get("GEO_CACHE_TTL", 300))
GEO_CACHE: dict          = {}
GEO_WHITELISTED_IPS      = {"127.0.0.1", "::1", "localhost"}
BROWSER_RESTRICTION_ENABLED = os.environ.get("BROWSER_RESTRICTION_ENABLED", "true").lower() == "true"

# ─── Seed / Fallback Data ─────────────────────────────────────────────────────
EMPRESAS_DEFAULT = [
  {"id":'TOKIO',    "nombre":'Desarrolladora Tokio SA de CV',       "rfc":'DTO150312L98'},
  {"id":'JOGOR',    "nombre":'Residencial Jogor SA de CV',          "rfc":'IJO170329QZ3'},
  {"id":'MARGOPH',  "nombre":'Margoph SA de CV',                    "rfc":'MAR170907EZ1'},
  {"id":'ERATO',    "nombre":'Erato Bienes Raíces SA de CV',        "rfc":'EBR250108RL4'},
  {"id":'LETGAB',   "nombre":'Letgab SAPI de CV',                   "rfc":'LET170405LQ6'},
  {"id":'ZIBACASAS',"nombre":'Zibacasas SA de CV',                  "rfc":'ZIB1211063X4'},
  {"id":'REM',      "nombre":'Residencial Eduardo Molina SA de CV', "rfc":'REM130222142A'},
  {"id":'ADW',      "nombre":'Desarrolladora ADW SA de CV',         "rfc":'DAD1506043H2'},
  {"id":'SOFITER',  "nombre":'Sofiter SA de CV',                    "rfc":'SOF191008G24'},
]

CC_DEFAULT = [
  {"id":'CC001',"empresaId":'TOKIO',"nombre":'Othon Park',"direccion":'Othon Mendizabal 10'},
]

INSUMOS_DEFAULT = []
DESARROLLOS_DEFAULT = [
  {"id":'TOKIO',"nombre":'Desarrolladora Tokio SA de CV'},
]

# ─── Auth helpers ─────────────────────────────────────────────────────────────
def hash_password_bcrypt(password: str) -> str:
    """Hash a password using bcrypt (secure, with auto-generated salt)."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password_bcrypt(password: str, hashed: str) -> bool:
    """Verify a password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def hash_password_legacy(password: str) -> str:
    """Legacy SHA-256 hash (kept only for migration of existing passwords)."""
    salted = "gu_salt_2026_" + password
    return hashlib.sha256(salted.encode("utf-8")).hexdigest()

# ─── Active sessions (persisted in sessions.json with expiration) ─────────────
ACTIVE_SESSIONS: dict = {}
SESSIONS_FILE = "sessions.json"

def load_sessions():
    global ACTIVE_SESSIONS
    if os.path.exists(SESSIONS_FILE):
        try:
            with open(SESSIONS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                now_time = time.time()
                ACTIVE_SESSIONS = {
                    t: s for t, s in data.items() if s.get("expires_at", 0) > now_time
                }
        except Exception as e:
            print(f"Warning: Could not load sessions: {e}", file=sys.stderr, flush=True)
            ACTIVE_SESSIONS = {}
    else:
        ACTIVE_SESSIONS = {}

def save_sessions():
    try:
        with open(SESSIONS_FILE, "w", encoding="utf-8") as f:
            json.dump(ACTIVE_SESSIONS, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Warning: Could not save sessions: {e}", file=sys.stderr, flush=True)

# ─── Catalog Cache ────────────────────────────────────────────────────────────
CATALOG_CACHE: dict = {
    "empresas": None,
    "centros_costo": None,
    "desarrollos": None,
    "insumos": None
}

def get_db_empresas():
    if CATALOG_CACHE["empresas"] is not None:
        return CATALOG_CACHE["empresas"]
    try:
        conn = get_db_connection(); cur = conn.cursor()
        cur.execute("SELECT id_empresa, nombre_empresa FROM testing.prof_empresas GROUP BY id_empresa, nombre_empresa ORDER BY CAST(id_empresa AS INTEGER);")
        rows = cur.fetchall(); cur.close(); conn.close()
        lst = [{"id": r[0], "nombre": r[1], "rfc": ""} for r in rows] if rows else EMPRESAS_DEFAULT.copy()
        if not any(e["id"] == "99" for e in lst):
            lst.append({"id": "99", "nombre": "Almacen", "rfc": ""})
        CATALOG_CACHE["empresas"] = lst
        return lst
        if 'conn' in locals() and conn:
            try: conn.close()
            except: pass
    except Exception as e:
        print(f"DB Warning empresas: {e}", file=sys.stderr, flush=True)
        CATALOG_CACHE["empresas"] = EMPRESAS_DEFAULT
        return EMPRESAS_DEFAULT

def get_db_centros_costo():
    if CATALOG_CACHE["centros_costo"] is not None:
        return CATALOG_CACHE["centros_costo"]
    try:
        conn = get_db_connection(); cur = conn.cursor()
        query = """
            SELECT DISTINCT
                cc.id_cc,
                emp.id_empresa,
                cc.nombre_cc
            FROM testing.prof_centros_costo cc
            LEFT JOIN testing.prof_empresas emp
                ON cc.source = emp.source
            WHERE SUBSTRING(cc.id_cc FROM 1 FOR 3) ~ '^[1-9A-Za-z](12|13|18|50)$'
            ORDER BY cc.nombre_cc;
        """
        cur.execute(query)
        rows = cur.fetchall(); cur.close(); conn.close()
        lst = [{"id": r[0], "empresaId": r[1], "nombre": r[2], "direccion": ""} for r in rows] if rows else CC_DEFAULT.copy()
        if not any(c["id"] == "999" for c in lst):
            lst.append({"id": "999", "empresaId": "99", "nombre": "Almacen", "direccion": ""})
        CATALOG_CACHE["centros_costo"] = lst
        return lst
        if 'conn' in locals() and conn:
            try: conn.close()
            except: pass
    except Exception as e:
        print(f"DB Warning centros_costo: {e}", file=sys.stderr, flush=True)
        CATALOG_CACHE["centros_costo"] = CC_DEFAULT
        return CC_DEFAULT

def get_db_desarrollos():
    if CATALOG_CACHE["desarrollos"] is not None:
        return CATALOG_CACHE["desarrollos"]
    try:
        conn = get_db_connection(); cur = conn.cursor()
        cur.execute("SELECT DISTINCT id_desarrollo, descripcion_desarrollo FROM testing.prof_desarrollos ORDER BY descripcion_desarrollo;")
        rows = cur.fetchall(); cur.close(); conn.close()
        CATALOG_CACHE["desarrollos"] = [{"id": r[0], "nombre": r[1]} for r in rows] if rows else DESARROLLOS_DEFAULT
        return CATALOG_CACHE["desarrollos"]
        if 'conn' in locals() and conn:
            try: conn.close()
            except: pass
    except Exception as e:
        print(f"DB Warning desarrollos: {e}", file=sys.stderr, flush=True)
        CATALOG_CACHE["desarrollos"] = DESARROLLOS_DEFAULT
        return DESARROLLOS_DEFAULT

def get_db_insumos():
    if CATALOG_CACHE["insumos"] is not None:
        return CATALOG_CACHE["insumos"]
    try:
        conn = get_db_connection(); cur = conn.cursor()
        cur.execute("""
            SELECT DISTINCT ins.insumo, ins.descripcion, ins.unidad, ins.tipo
            FROM testing.prof_insumos_v2 ins
            ORDER BY ins.descripcion;
        """)
        rows = cur.fetchall(); cur.close(); conn.close()
        CATALOG_CACHE["insumos"] = [{"id": r[0], "clave": r[0], "nombre": r[1], "unidad": r[2] or "—", "categoria": r[3] or "Material"} for r in rows] if rows else INSUMOS_DEFAULT
        return CATALOG_CACHE["insumos"]
        if 'conn' in locals() and conn:
            try: conn.close()
            except: pass
    except Exception as e:
        print(f"DB Warning insumos: {e}", file=sys.stderr, flush=True)
        CATALOG_CACHE["insumos"] = INSUMOS_DEFAULT
        return INSUMOS_DEFAULT

def get_db_traspasos(conn=None):
    close_conn = False
    try:
        if conn is None:
            conn = get_db_connection()
            close_conn = True
        cur = conn.cursor()
        cur.execute("""
            SELECT id_solicitud, folio, tipo_traspaso, solicitante, estado,
                   empresa_origen, empresa_destino, cc_origen, cc_destino,
                   fecha_solicitud, observaciones,
                   autorizador, fecha_autorizacion, comentario_auth,
                   receptor, fecha_recepcion, comentario_rec,
                   autorizador2, fecha_autorizacion2, comentario_auth2,
                   folio_original_ref
            FROM testing.solicitudes_traspasos_v2
            ORDER BY id_solicitud;
        """)
        sol_rows = cur.fetchall()
        if not sol_rows:
            cur.close()
            if close_conn: conn.close()
            return []

        cur.execute("""
            SELECT id_solicitud, clave_insumo, nombre_insumo, cantidad, unidad, precio, comentario_insumo, imagen
            FROM testing.detalle_traspaso_insumos_v2
            ORDER BY id_detalle;
        """)
        det_rows = cur.fetchall()
        cur.close()
        if close_conn: conn.close()

        items_map: dict = {}
        for d in det_rows:
            sid = d[0]
            items_map.setdefault(sid, []).append({
                "insumoId": d[1], "nombre": d[2], "cantidad": float(d[3]),
                "unidad": d[4], "precio": float(d[5]) if d[5] is not None else 0.0,
                "comentario": d[6] or "", "imagen": d[7] or ""
            })

        traspasos = []
        for r in sol_rows:
            sid = r[0]
            traspasos.append({
                "id": f"DB{sid}", "folio": r[1], "tipo": r[2], "solicitante": r[3],
                "status": r[4] or "pendiente",
                "empresaOrigen": r[5] or "", "empresaDestino": r[6] or "",
                "ccOrigen": r[7], "ccDestino": r[8],
                "fechaSolicitud": r[9].isoformat() if r[9] else None,
                "observaciones": r[10] or "",
                "autorizador": r[11], "fechaAutorizacion": r[12].isoformat() if r[12] else None,
                "comentarioAuth": r[13], "receptor": r[14],
                "fechaRecepcion": r[15].isoformat() if r[15] else None,
                "comentarioRec": r[16], "autorizador2": r[17],
                "fechaAutorizacion2": r[18].isoformat() if r[18] else None,
                "comentarioAuth2": r[19], "folioOriginalRef": r[20] or "",
                "items": items_map.get(sid, []), "_dbId": sid,
            })
        return traspasos
    except Exception as e:
        print(f"DB Warning get_db_traspasos: {e}", file=sys.stderr, flush=True)
        return []

def get_db_traspasos_paginated(
    page: int = 1,
    limit: int = 50,
    status: Optional[str] = None,
    tipo: Optional[str] = None,
    empresa: Optional[str] = None,
    cc: Optional[str] = None,
    insumo: Optional[str] = None,
    user: Optional[dict] = None
):
    query = """
        SELECT DISTINCT s.id_solicitud, s.folio, s.tipo_traspaso, s.solicitante, s.estado,
               s.empresa_origen, s.empresa_destino, s.cc_origen, s.cc_destino,
               s.fecha_solicitud, s.observaciones,
               s.autorizador, s.fecha_autorizacion, s.comentario_auth,
               s.receptor, s.fecha_recepcion, s.comentario_rec,
               s.autorizador2, s.fecha_autorizacion2, s.comentario_auth2,
               s.folio_original_ref
        FROM testing.solicitudes_traspasos_v2 s
    """
    
    if insumo:
        query += " JOIN testing.detalle_traspaso_insumos_v2 d ON s.id_solicitud = d.id_solicitud"
        
    where_clauses = []
    params = []
    
    if user and user.get("rol", "") not in ("administrador", "residente"):
        user_cc_ids = [c.strip() for c in (user.get("cc_ids") or "").split(",") if c.strip()]
        user_empresa_ids = [e.strip() for e in (user.get("empresa_id") or "").split(",") if e.strip()]
        if user_cc_ids:
            where_clauses.append("(s.cc_origen IN %s OR s.cc_destino IN %s OR s.solicitante = %s)")
            params.extend([tuple(user_cc_ids), tuple(user_cc_ids), user.get("nombre", "")])
        elif user_empresa_ids:
            where_clauses.append("(s.empresa_origen IN %s OR s.empresa_destino IN %s)")
            params.extend([tuple(user_empresa_ids), tuple(user_empresa_ids)])

    if status:
        where_clauses.append("s.estado = %s")
        params.append(status)
    if tipo:
        where_clauses.append("s.tipo_traspaso = %s")
        params.append(tipo)
    if cc:
        where_clauses.append("(s.cc_origen = %s OR s.cc_destino = %s)")
        params.extend([cc, cc])
    if empresa:
        where_clauses.append("(s.empresa_origen = %s OR s.empresa_destino = %s)")
        params.extend([empresa, empresa])
    if insumo:
        where_clauses.append("d.clave_insumo = %s")
        params.append(insumo)

    if where_clauses:
        query += " WHERE " + " AND ".join(where_clauses)
        
    count_query = f"SELECT COUNT(DISTINCT s.id_solicitud) FROM testing.solicitudes_traspasos_v2 s"
    if insumo:
        count_query += " JOIN testing.detalle_traspaso_insumos_v2 d ON s.id_solicitud = d.id_solicitud"
    if where_clauses:
        count_query += " WHERE " + " AND ".join(where_clauses)

    query += " ORDER BY s.fecha_solicitud DESC, s.id_solicitud DESC"
    
    if limit > 0:
        query += " LIMIT %s OFFSET %s"
        offset = (page - 1) * limit
        params_paginated = params + [limit, offset]
    else:
        params_paginated = params

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(count_query, params)
        total_count = cur.fetchone()[0]
        
        cur.execute(query, params_paginated)
        sol_rows = cur.fetchall()
        
        if not sol_rows:
            cur.close(); conn.close()
            return [], total_count

        sol_ids = tuple(r[0] for r in sol_rows)
        cur.execute("""
            SELECT id_solicitud, clave_insumo, nombre_insumo, cantidad, unidad, precio, comentario_insumo, imagen
            FROM testing.detalle_traspaso_insumos_v2
            WHERE id_solicitud IN %s
            ORDER BY id_detalle;
        """, (sol_ids,))
        det_rows = cur.fetchall()
        cur.close(); conn.close()

        items_map = {}
        for d in det_rows:
            sid = d[0]
            items_map.setdefault(sid, []).append({
                "insumoId": d[1], "nombre": d[2], "cantidad": float(d[3]),
                "unidad": d[4], "precio": float(d[5]) if d[5] is not None else 0.0,
                "comentario": d[6] or "", "imagen": d[7] or ""
            })

        traspasos = []
        for r in sol_rows:
            sid = r[0]
            traspasos.append({
                "id": f"DB{sid}", "folio": r[1], "tipo": r[2], "solicitante": r[3],
                "status": r[4] or "pendiente",
                "empresaOrigen": r[5] or "", "empresaDestino": r[6] or "",
                "ccOrigen": r[7], "ccDestino": r[8],
                "fechaSolicitud": r[9].isoformat() if r[9] else None,
                "observaciones": r[10] or "",
                "autorizador": r[11], "fechaAutorizacion": r[12].isoformat() if r[12] else None,
                "comentarioAuth": r[13], "receptor": r[14],
                "fechaRecepcion": r[15].isoformat() if r[15] else None,
                "comentarioRec": r[16], "autorizador2": r[17],
                "fechaAutorizacion2": r[18].isoformat() if r[18] else None,
                "comentarioAuth2": r[19], "folioOriginalRef": r[20] or "",
                "items": items_map.get(sid, []), "_dbId": sid,
            })
            
        return traspasos, total_count
    except Exception as e:
        print(f"DB Warning get_db_traspasos_paginated: {e}", file=sys.stderr, flush=True)
        if 'conn' in locals() and conn:
            try: conn.close()
            except: pass
        return [], 0

def save_db_traspaso(t: dict, conn=None):
    close_conn = False
    try:
        if conn is None:
            conn = get_db_connection()
            close_conn = True
        cur = conn.cursor()
        cur.execute('SELECT id_solicitud FROM testing.solicitudes_traspasos_v2 WHERE folio = %s;', (t["folio"],))
        existing = cur.fetchone()

        if existing:
            sol_id = existing[0]
            cur.execute("""
                UPDATE testing.solicitudes_traspasos_v2
                SET estado=%s, autorizador=%s, fecha_autorizacion=%s, comentario_auth=%s,
                    receptor=%s, fecha_recepcion=%s, comentario_rec=%s, observaciones=%s,
                    autorizador2=%s, fecha_autorizacion2=%s, comentario_auth2=%s, folio_original_ref=%s
                WHERE id_solicitud = %s;
            """, (
                t.get("status","pendiente"), t.get("autorizador"), t.get("fechaAutorizacion"),
                t.get("comentarioAuth"), t.get("receptor"), t.get("fechaRecepcion"),
                t.get("comentarioRec"), t.get("observaciones",""), t.get("autorizador2"),
                t.get("fechaAutorizacion2"), t.get("comentarioAuth2"),
                t.get("folioOriginalRef", None), sol_id,
            ))
        else:
            cur.execute("""
                INSERT INTO testing.solicitudes_traspasos_v2
                    (folio, tipo_traspaso, solicitante, estado, empresa_origen, empresa_destino,
                     cc_origen, cc_destino, fecha_solicitud, observaciones, folio_original_ref)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING id_solicitud;
            """, (
                t["folio"], t.get("tipo","PRS"), t.get("solicitante",""), t.get("status","pendiente"),
                t.get("empresaOrigen",""), t.get("empresaDestino",""), t.get("ccOrigen",""),
                t.get("ccDestino",""), t.get("fechaSolicitud",None), t.get("observaciones",""),
                t.get("folioOriginalRef",None),
            ))
            sol_id = cur.fetchone()[0]
            for item in t.get("items", []):
                insumo_id = item.get("insumoId","")
                nombre    = item.get("nombre","")
                unidad    = item.get("unidad","")
                if not nombre or not unidad or nombre == insumo_id:
                    try:
                        cur.execute("SELECT descripcion, unidad FROM testing.prof_insumos_v2 WHERE insumo = %s LIMIT 1;", (insumo_id,))
                        row = cur.fetchone()
                        if row:
                            if not nombre or nombre == insumo_id: nombre = row[0]
                            if not unidad: unidad = row[1]
                    except Exception: pass
                if not nombre: nombre = insumo_id
                if not unidad: unidad = "Pieza"
                cur.execute("""
                    INSERT INTO testing.detalle_traspaso_insumos_v2
                        (id_solicitud, clave_insumo, nombre_insumo, cantidad, unidad, precio, comentario_insumo, imagen)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s);
                """, (sol_id, insumo_id, nombre, item.get("cantidad",0), unidad,
                      item.get("precio",0.0), item.get("comentario",""), item.get("imagen","")))

        conn.commit(); cur.close()
        if close_conn: conn.close()
        return sol_id
    except Exception as e:
        print(f"DB Error save_db_traspaso: {e}", file=sys.stderr, flush=True)
        if conn:
            try: conn.rollback()
            except Exception: pass
            if close_conn:
                try: conn.close()
                except Exception: pass
        return None

def get_max_folio_number(prefix: str, conn=None):
    close_conn = False
    try:
        if conn is None:
            conn = get_db_connection()
            close_conn = True
        cur = conn.cursor()
        cur.execute("""
            SELECT folio FROM testing.solicitudes_traspasos_v2
            WHERE folio LIKE %s
            ORDER BY id_solicitud DESC LIMIT 1;
        """, (f"TRP-{prefix}-%",))
        row = cur.fetchone(); cur.close()
        if close_conn: conn.close()
        if row:
            parts = row[0].split("-")
            if len(parts) == 4: return int(parts[3])
        return 0
    except Exception as e:
        print(f"DB Warning get_max_folio: {e}", file=sys.stderr, flush=True)
        return 0

def init_db():
    """Crea tablas y usuario admin si no existen."""
    try:
        conn = get_db_connection(); cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS testing.prof_usuarios (
                id SERIAL PRIMARY KEY, nombre TEXT NOT NULL, correo TEXT NOT NULL UNIQUE,
                username TEXT NOT NULL UNIQUE, password TEXT NOT NULL,
                rol TEXT NOT NULL CHECK (rol IN ('almacenista','control_obra','residente','administrador')),
                activo BOOLEAN DEFAULT TRUE, creado_en TIMESTAMP DEFAULT NOW()
            );
        """)
        cur.execute("ALTER TABLE testing.prof_usuarios ADD COLUMN IF NOT EXISTS empresa_id TEXT DEFAULT NULL;")
        cur.execute("ALTER TABLE testing.prof_usuarios ADD COLUMN IF NOT EXISTS cc_ids TEXT DEFAULT NULL;")
        cur.execute("SELECT COUNT(*) FROM testing.prof_usuarios;")
        if cur.fetchone()[0] == 0:
            cur.execute("""
                INSERT INTO testing.prof_usuarios (nombre, correo, username, password, rol)
                VALUES (%s, %s, %s, %s, %s)
            """, ('Administrador', 'admin@grupourban.ia', 'admin', hash_password_bcrypt('admin123'), 'administrador'))
            print("Auth: Usuario admin creado. usuario=admin | password=admin123", flush=True)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS testing.solicitudes_traspasos_v2 (
                id_solicitud SERIAL PRIMARY KEY, folio VARCHAR(50) NOT NULL UNIQUE,
                tipo_traspaso VARCHAR(50) NOT NULL, solicitante VARCHAR(100) NOT NULL,
                estado VARCHAR(30) DEFAULT 'pendiente', empresa_origen VARCHAR(100) NULL,
                empresa_destino VARCHAR(100) NULL, cc_origen VARCHAR(150) NOT NULL,
                cc_destino VARCHAR(150) NOT NULL, fecha_solicitud TIMESTAMP NOT NULL,
                observaciones TEXT NULL, autorizador VARCHAR(100) NULL,
                fecha_autorizacion TIMESTAMP NULL, comentario_auth TEXT NULL,
                receptor VARCHAR(100) NULL, fecha_recepcion TIMESTAMP NULL,
                comentario_rec TEXT NULL
            );
        """)
        for col_sql in [
            "ALTER TABLE testing.solicitudes_traspasos_v2 ADD COLUMN IF NOT EXISTS autorizador2 VARCHAR(100) NULL;",
            "ALTER TABLE testing.solicitudes_traspasos_v2 ADD COLUMN IF NOT EXISTS fecha_autorizacion2 TIMESTAMP NULL;",
            "ALTER TABLE testing.solicitudes_traspasos_v2 ADD COLUMN IF NOT EXISTS comentario_auth2 TEXT NULL;",
            "ALTER TABLE testing.solicitudes_traspasos_v2 ADD COLUMN IF NOT EXISTS folio_original_ref VARCHAR(50) NULL;",
        ]:
            cur.execute(col_sql)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS testing.detalle_traspaso_insumos_v2 (
                id_detalle SERIAL PRIMARY KEY, id_solicitud INT NOT NULL,
                clave_insumo VARCHAR(50) NOT NULL, nombre_insumo VARCHAR(150) NOT NULL,
                cantidad NUMERIC(12,4) NOT NULL, precio NUMERIC(12,4) DEFAULT 0,
                comentario_insumo TEXT DEFAULT '', unidad VARCHAR(20) NOT NULL,
                imagen TEXT DEFAULT '',
                CONSTRAINT fk_solicitud_v2 FOREIGN KEY (id_solicitud)
                    REFERENCES testing.solicitudes_traspasos_v2(id_solicitud) ON DELETE CASCADE
            );
        """)
        conn.commit(); cur.close(); conn.close()
        print("DB: Tablas verificadas/creadas correctamente.", flush=True)
    except Exception as e:
        print(f"DB Warning init_db: {e}", file=sys.stderr, flush=True)

# ─── Geo / Browser checks ─────────────────────────────────────────────────────
def check_geo_location(ip_address: str):
    if ip_address in GEO_WHITELISTED_IPS:
        return True, "IP local (desarrollo)"
    cached = GEO_CACHE.get(ip_address)
    if cached:
        allowed, timestamp = cached
        if time.time() - timestamp < GEO_CACHE_TTL:
            return allowed, "caché"
    try:
        url = f"http://ip-api.com/json/{ip_address}?fields=status,country,city,regionName,query"
        req = urllib.request.Request(url, headers={"User-Agent": "TraspaServer/2.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        if data.get("status") != "success":
            return True, "API no disponible (fail-open)"
        city   = data.get("city","")
        region = data.get("regionName","")
        country= data.get("country","")
        cdmx_variants = ["mexico city","ciudad de méxico","ciudad de mexico","cdmx"]
        is_allowed = (city.lower() in cdmx_variants or region.lower() in ["ciudad de méxico","ciudad de mexico","mexico city","distrito federal"]) and country.lower() == "mexico"
        GEO_CACHE[ip_address] = (is_allowed, time.time())
        return is_allowed, f"{city}, {region}, {country}"
    except Exception as e:
        return True, f"Error de consulta (fail-open): {e}"

def check_browser(user_agent: str):
    if not user_agent:
        return False, "Sin User-Agent"
    ua = user_agent.lower()
    if "edg/" in ua or "edge/" in ua:
        return True, "Microsoft Edge"
    if "chrome/" in ua and "opr/" not in ua:
        return True, "Google Chrome"
    if "firefox/" in ua: return False, "Mozilla Firefox"
    if "safari/" in ua and "chrome/" not in ua: return False, "Safari"
    if "opr/" in ua or "opera" in ua: return False, "Opera"
    return False, "Navegador desconocido"

# ─── Auth dependency ──────────────────────────────────────────────────────────
def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization","")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado. Inicie sesión nuevamente.")
    token = auth_header.split(" ", 1)[1].strip()
    session = ACTIVE_SESSIONS.get(token)
    if not session:
        raise HTTPException(status_code=401, detail="No autorizado. Inicie sesión nuevamente.")
    
    # Check expiration
    if time.time() > session.get("expires_at", 0):
        ACTIVE_SESSIONS.pop(token, None)
        save_sessions()
        raise HTTPException(status_code=401, detail="Sesión expirada. Inicie sesión nuevamente.")
        
    return session["user"]

# ─── Lifespan (startup) ───────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    load_sessions()
    print("DB: Pre-cargando catálogos...", flush=True)
    get_db_empresas()
    get_db_centros_costo()
    get_db_desarrollos()
    get_db_insumos()
    print("DB: Catálogos pre-cargados exitosamente.", flush=True)
    print(f"\n=======================================================", flush=True)
    print(f" Servidor FastAPI levantado en: http://localhost:{PORT}", flush=True)
    print(f" Login:    http://localhost:{PORT}/login.html",          flush=True)
    print(f" Registro: http://localhost:{PORT}/register.html",       flush=True)
    print(f" API Docs: http://localhost:{PORT}/docs",                flush=True)
    print(f"-------------------------------------------------------", flush=True)
    print(f" Restriccion Geo:     {'ACTIVADA (solo CDMX)' if GEO_RESTRICTION_ENABLED else 'DESACTIVADA'}", flush=True)
    print(f" Restriccion Browser: {'ACTIVADA (Chrome/Edge)' if BROWSER_RESTRICTION_ENABLED else 'DESACTIVADA'}", flush=True)
    print(f"=======================================================\n", flush=True)
    yield

# ─── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(title="Sistema de Traspasos – Grupo Urbania", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Access restriction middleware ────────────────────────────────────────────
@app.middleware("http")
async def access_restriction_middleware(request: Request, call_next):
    path = request.url.path
    is_api = path.startswith("/api/")

    # Browser check (solo para páginas HTML)
    if BROWSER_RESTRICTION_ENABLED and not is_api and request.method != "OPTIONS":
        is_page = path.endswith(".html") or path == "/" or ("." not in path.split("/")[-1])
        if is_page:
            ua = request.headers.get("User-Agent", "")
            ok, browser_name = check_browser(ua)
            if not ok:
                html = f"""<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Navegador No Permitido</title>
                <style>body{{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f0f23;color:#fff;margin:0}}
                .box{{text-align:center;padding:40px;background:rgba(255,255,255,.05);border-radius:16px;max-width:480px}}</style></head>
                <body><div class="box"><h1>🛡️ Navegador No Permitido</h1>
                <p>Detectado: <strong>{browser_name}</strong></p>
                <p>Solo se permite <strong>Google Chrome</strong> o <strong>Microsoft Edge</strong>.</p></div></body></html>"""
                return HTMLResponse(content=html, status_code=403)

    # Geo check
    if GEO_RESTRICTION_ENABLED and request.method != "OPTIONS":
        client_ip = request.headers.get("X-Forwarded-For", request.headers.get("X-Real-IP", request.client.host if request.client else "127.0.0.1"))
        client_ip = client_ip.split(",")[0].strip()
        ok, geo_info = check_geo_location(client_ip)
        if not ok:
            html = f"""<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Acceso Restringido</title>
            <style>body{{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f0f23;color:#fff;margin:0}}
            .box{{text-align:center;padding:40px;background:rgba(255,255,255,.05);border-radius:16px;max-width:480px}}</style></head>
            <body><div class="box"><h1>🛡️ Acceso Restringido</h1>
            <p>Ubicación detectada: <strong>{geo_info}</strong></p>
            <p>Solo disponible desde <strong>Ciudad de México (CDMX)</strong>.</p></div></body></html>"""
            return HTMLResponse(content=html, status_code=403)

    return await call_next(request)

# ─── API Routes ───────────────────────────────────────────────────────────────

@app.get("/api/public/empresas")
def api_public_empresas():
    return {"empresas": get_db_empresas()}

@app.get("/api/public/centros_costo")
def api_public_centros_costo():
    return {"centrosCosto": get_db_centros_costo()}

# ─── Empresas REST Endpoints ───
@app.get("/api/empresas")
def api_get_empresas(user: dict = Depends(get_current_user)):
    empresas = get_db_empresas()
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                local_db = json.load(f)
            for le in local_db.get("empresas", []):
                if not any(e["id"] == le["id"] for e in empresas):
                    empresas.append(le)
        except Exception: pass
    return {"empresas": empresas}

@app.post("/api/empresas")
async def api_post_empresas(request: Request, user: dict = Depends(get_current_user)):
    data = await request.json()
    official_emp = get_db_empresas()
    incoming_emp = data.get("empresas", [])
    filtered_emp = [e for e in incoming_emp if not any(oe["id"] == e["id"] for oe in official_emp)]
    
    local_db = {}
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                local_db = json.load(f)
        except Exception: pass
    
    local_db["empresas"] = filtered_emp
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(local_db, f, indent=2, ensure_ascii=False)
    return {"status": "success"}

# ─── Centros de Costo REST Endpoints ───
@app.get("/api/centros_costo")
def api_get_centros_costo(user: dict = Depends(get_current_user)):
    centros_costo = get_db_centros_costo()
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                local_db = json.load(f)
            for lcc in local_db.get("centrosCosto", []):
                if not any(c["id"] == lcc["id"] for c in centros_costo):
                    centros_costo.append(lcc)
        except Exception: pass
    return {"centrosCosto": centros_costo}

@app.post("/api/centros_costo")
async def api_post_centros_costo(request: Request, user: dict = Depends(get_current_user)):
    data = await request.json()
    official_ccs = get_db_centros_costo()
    incoming_ccs = data.get("centrosCosto", [])
    filtered_ccs = [c for c in incoming_ccs if not any(oc["id"] == c["id"] for oc in official_ccs)]
    
    local_db = {}
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                local_db = json.load(f)
        except Exception: pass
        
    local_db["centrosCosto"] = filtered_ccs
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(local_db, f, indent=2, ensure_ascii=False)
    return {"status": "success"}

# ─── Insumos REST Endpoints ───
@app.get("/api/insumos")
def api_get_insumos(user: dict = Depends(get_current_user)):
    insumos = get_db_insumos()
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                local_db = json.load(f)
            for li in local_db.get("insumos", []):
                if not any(i["id"] == li["id"] for i in insumos):
                    insumos.append(li)
        except Exception: pass
    return {"insumos": insumos}

@app.post("/api/insumos")
async def api_post_insumos(request: Request, user: dict = Depends(get_current_user)):
    data = await request.json()
    official_ins = get_db_insumos()
    incoming_ins = data.get("insumos", [])
    filtered_ins = [i for i in incoming_ins if not any(oi["id"] == i["id"] for oi in official_ins)]
    
    local_db = {}
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                local_db = json.load(f)
        except Exception: pass
        
    local_db["insumos"] = filtered_ins
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(local_db, f, indent=2, ensure_ascii=False)
    return {"status": "success"}

# ─── Desarrollos REST Endpoints ───
@app.get("/api/desarrollos")
def api_get_desarrollos(user: dict = Depends(get_current_user)):
    return {"desarrollos": get_db_desarrollos()}

# ─── Traspasos REST Endpoints ───
@app.get("/api/traspasos")
def api_get_traspasos(
    page: int = 1,
    limit: int = 0,
    status: Optional[str] = None,
    tipo: Optional[str] = None,
    empresa: Optional[str] = None,
    cc: Optional[str] = None,
    insumo: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    traspasos, total = get_db_traspasos_paginated(
        page=page,
        limit=limit,
        status=status,
        tipo=tipo,
        empresa=empresa,
        cc=cc,
        insumo=insumo,
        user=user
    )
    return {"traspasos": traspasos, "total": total, "page": page, "limit": limit}

@app.post("/api/traspasos")
async def api_post_traspasos(request: Request, user: dict = Depends(get_current_user)):
    data = await request.json()
    incoming_traspasos = data.get("traspasos", [])
    saved_count = 0
    pg_conn = None
    try:
        pg_conn = get_db_connection()
        for t in incoming_traspasos:
            if t.get("folio", ""):
                result = save_db_traspaso(t, conn=pg_conn)
                if result is None:
                    raise Exception(f"Error al guardar traspaso con folio {t.get('folio')}")
                saved_count += 1
    except Exception as e:
        print(f"DB Error sync traspasos: {e}", file=sys.stderr, flush=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if pg_conn:
            try: pg_conn.close()
            except Exception: pass
    return {"status": "success", "saved_count": saved_count}

# ─── Folios REST Endpoints ───
@app.get("/api/folios")
def api_get_folios(user: dict = Depends(get_current_user)):
    pg_conn = None
    try:
        pg_conn = get_db_connection()
    except Exception as e:
        print(f"DB Error connecting: {e}", file=sys.stderr, flush=True)
        
    folio_prs = get_max_folio_number("PRS", conn=pg_conn)
    folio_tob = get_max_folio_number("TOB", conn=pg_conn)
    folio_dev = get_max_folio_number("DEV", conn=pg_conn)
    folio_gar = get_max_folio_number("GAR", conn=pg_conn)
    
    if pg_conn:
        try: pg_conn.close()
        except Exception: pass
        
    return {"folios": {"PRS": folio_prs, "TOB": folio_tob, "DEV": folio_dev, "GAR": folio_gar}}

@app.get("/api/state")
def api_get_state(user: dict = Depends(get_current_user)):
    empresas      = get_db_empresas()
    centros_costo = get_db_centros_costo()
    insumos       = get_db_insumos()
    desarrollos   = get_db_desarrollos()

    pg_conn = None
    try:
        pg_conn = get_db_connection()
    except Exception as e:
        print(f"DB Error connecting: {e}", file=sys.stderr, flush=True)

    traspasos  = get_db_traspasos(conn=pg_conn)
    folio_prs  = get_max_folio_number("PRS", conn=pg_conn)
    folio_tob  = get_max_folio_number("TOB", conn=pg_conn)
    folio_dev  = get_max_folio_number("DEV", conn=pg_conn)
    folio_gar  = get_max_folio_number("GAR", conn=pg_conn)
    folios     = {"PRS": folio_prs, "TOB": folio_tob, "DEV": folio_dev, "GAR": folio_gar}

    if pg_conn:
        try: pg_conn.close()
        except Exception: pass

    # Merge local db.json extras
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                local_db = json.load(f)
            for le in local_db.get("empresas", []):
                if not any(e["id"] == le["id"] for e in empresas):
                    empresas.append(le)
            for lcc in local_db.get("centrosCosto", []):
                if not any(c["id"] == lcc["id"] for c in centros_costo):
                    centros_costo.append(lcc)
            for li in local_db.get("insumos", []):
                if not any(i["id"] == li["id"] for i in insumos):
                    insumos.append(li)
        except Exception as e:
            print(f"Error leyendo db.json: {e}", file=sys.stderr, flush=True)

    # Filtrar traspasos por rol / cc_ids
    user_rol = user.get("rol","")
    if user_rol not in ("administrador","residente"):
        user_cc_ids      = [c.strip() for c in (user.get("cc_ids") or "").split(",") if c.strip()]
        user_empresa_ids = [e.strip() for e in (user.get("empresa_id") or "").split(",") if e.strip()]
        if user_cc_ids:
            traspasos = [t for t in traspasos if t.get("ccOrigen","") in user_cc_ids or t.get("ccDestino","") in user_cc_ids or t.get("solicitante","") == user.get("nombre","")]
        elif user_empresa_ids:
            filtered = []
            for t in traspasos:
                cc_ori_obj = next((c for c in centros_costo if c["id"] == t.get("ccOrigen","")), None)
                cc_des_obj = next((c for c in centros_costo if c["id"] == t.get("ccDestino","")), None)
                ori_emp = cc_ori_obj["empresaId"] if cc_ori_obj else t.get("empresaOrigen","")
                des_emp = cc_des_obj["empresaId"] if cc_des_obj else t.get("empresaDestino","")
                if ori_emp in user_empresa_ids or des_emp in user_empresa_ids:
                    filtered.append(t)
            traspasos = filtered

    return {"empresas": empresas, "centrosCosto": centros_costo, "insumos": insumos, "desarrollos": desarrollos, "traspasos": traspasos, "folios": folios}

@app.post("/api/state")
async def api_post_state(request: Request, user: dict = Depends(get_current_user)):
    state_data     = await request.json()
    official_emp   = get_db_empresas()
    official_ccs   = get_db_centros_costo()
    official_ins   = get_db_insumos()

    incoming_traspasos = state_data.get("traspasos", [])
    saved_count = 0
    pg_conn = None
    try:
        pg_conn = get_db_connection()
        for t in incoming_traspasos:
            if t.get("folio",""):
                result = save_db_traspaso(t, conn=pg_conn)
                if result is not None:
                    saved_count += 1
    except Exception as e:
        print(f"DB Error sync traspasos: {e}", file=sys.stderr, flush=True)
    finally:
        if pg_conn:
            try: pg_conn.close()
            except Exception: pass

    print(f"Server: {saved_count}/{len(incoming_traspasos)} traspasos sincronizados a Postgres.", flush=True)

    local_db = {
        "empresas":    [e for e in state_data.get("empresas",[]) if not any(oe["id"]==e["id"] for oe in official_emp)],
        "centrosCosto":[c for c in state_data.get("centrosCosto",[]) if not any(oc["id"]==c["id"] for oc in official_ccs)],
        "insumos":     [i for i in state_data.get("insumos",[]) if not any(oi["id"]==i["id"] for oi in official_ins)],
    }
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(local_db, f, indent=2, ensure_ascii=False)
    print("Server: Estado guardado en db.json + Postgres.", flush=True)
    return {"status": "success"}

@app.get("/api/users")
def api_get_users(user: dict = Depends(get_current_user)):
    try:
        conn = get_db_connection(); cur = conn.cursor()
        cur.execute("""
            SELECT id, nombre, correo, username, rol, activo, creado_en, empresa_id, cc_ids
            FROM testing.prof_usuarios ORDER BY id;
        """)
        cols  = ["id","nombre","correo","username","rol","activo","creado_en","empresa_id","cc_ids"]
        users = [dict(zip(cols, row)) for row in cur.fetchall()]
        cur.close(); conn.close()
        return {"users": users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login")
async def api_login(request: Request):
    body     = await request.json()
    username = body.get("username","").strip()
    password = body.get("password","")
    if not username or not password:
        raise HTTPException(status_code=400, detail="Usuario y contraseña requeridos.")
    try:
        conn = get_db_connection(); cur = conn.cursor()
        # Fetch user WITH stored password hash for verification
        cur.execute("""
            SELECT id, nombre, correo, username, rol, activo, empresa_id, cc_ids, password
            FROM testing.prof_usuarios WHERE username = %s
        """, (username,))
        row = cur.fetchone()
    except Exception as e:
        if 'conn' in locals() and conn:
            try: conn.close()
            except: pass
        raise HTTPException(status_code=500, detail="Error interno del servidor.")
    
    if not row:
        if 'conn' in locals() and conn:
            try: conn.close()
            except: pass
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos.")
    
    stored_hash = row[8]
    password_valid = False
    needs_upgrade = False
    
    # Try bcrypt verification first (new format)
    if stored_hash and stored_hash.startswith("$2"):
        password_valid = verify_password_bcrypt(password, stored_hash)
    else:
        # Fallback: try legacy SHA-256 verification
        if stored_hash == hash_password_legacy(password):
            password_valid = True
            needs_upgrade = True  # Mark for automatic upgrade to bcrypt
    
    if not password_valid:
        if 'conn' in locals() and conn:
            try: conn.close()
            except: pass
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos.")
    
    if not row[5]:
        if 'conn' in locals() and conn:
            try: conn.close()
            except: pass
        raise HTTPException(status_code=403, detail="Tu cuenta está desactivada. Contacta al administrador.")
    
    # Auto-upgrade legacy SHA-256 hash to bcrypt
    if needs_upgrade:
        try:
            new_hash = hash_password_bcrypt(password)
            cur.execute("UPDATE testing.prof_usuarios SET password = %s WHERE id = %s;", (new_hash, row[0]))
            conn.commit()
            print(f"Auth: Password de '{username}' migrado de SHA-256 a bcrypt.", flush=True)
        except Exception as e:
            print(f"Auth Warning: No se pudo migrar password de {username}: {e}", file=sys.stderr, flush=True)
    
    try: cur.close(); conn.close()
    except: pass
    
    user  = {"id": row[0], "nombre": row[1], "correo": row[2], "username": row[3], "rol": row[4], "empresa_id": row[6], "cc_ids": row[7]}
    token = hashlib.sha256(os.urandom(16)).hexdigest()
    # Expira en 8 horas (28800 segundos)
    ACTIVE_SESSIONS[token] = {
        "user": user,
        "expires_at": time.time() + 28800
    }
    save_sessions()
    print(f"Auth: Login exitoso - {username} ({row[4]}) empresa={row[6]}", flush=True)
    return {"user": user, "token": token}

@app.post("/api/auth/register", status_code=201)
async def api_register(request: Request, user: dict = Depends(get_current_user)):
    # Solo administradores pueden registrar nuevos usuarios
    if user.get("rol") != "administrador":
        raise HTTPException(status_code=403, detail="Solo los administradores pueden registrar nuevos usuarios.")
    
    body       = await request.json()
    nombre     = body.get("nombre","").strip()
    username   = body.get("username","").strip()
    correo     = body.get("correo","").strip()
    rol        = body.get("rol","").strip()
    password   = body.get("password","")
    empresa_id = body.get("empresa_id", None)
    cc_ids     = body.get("cc_ids", None)
    roles_validos = {"almacenista","control_obra","residente","administrador"}
    if not all([nombre, username, correo, rol, password]):
        raise HTTPException(status_code=400, detail="Todos los campos son obligatorios.")
    if rol not in roles_validos:
        raise HTTPException(status_code=400, detail="Rol inválido.")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres.")
    if rol not in ("administrador","residente") and not empresa_id:
        raise HTTPException(status_code=400, detail="Debes seleccionar la empresa a la que perteneces.")
    if rol not in ("administrador","residente") and not cc_ids:
        raise HTTPException(status_code=400, detail="Debes seleccionar al menos un centro de costo.")
    try:
        conn = get_db_connection(); cur = conn.cursor()
        cur.execute("""
            INSERT INTO testing.prof_usuarios (nombre, correo, username, password, rol, empresa_id, cc_ids)
            VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id;
        """, (nombre, correo, username, hash_password_bcrypt(password), rol, empresa_id or None, cc_ids or None))
        new_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        print(f"Auth: Nuevo usuario registrado por {user.get('username','')} - {username} ({rol})", flush=True)
        return {"ok": True, "id": new_id}
    except psycopg2.errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="El usuario o correo ya está registrado.")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno del servidor.")

@app.put("/api/users/{user_id}")
async def api_update_user(user_id: int, request: Request, user: dict = Depends(get_current_user)):
    body    = await request.json()
    updates = []; params = []
    if "nombre" in body:
        nombre = body["nombre"].strip()
        if not nombre: raise HTTPException(status_code=400, detail="El nombre no puede estar vacío.")
        updates.append("nombre = %s"); params.append(nombre)
    if "password" in body and body["password"]:
        pwd = body["password"]
        if len(pwd) < 6: raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres.")
        updates.append("password = %s"); params.append(hash_password_bcrypt(pwd))
    if "rol"       in body: updates.append("rol = %s"); params.append(body["rol"])
    if "activo"    in body: updates.append("activo = %s"); params.append(body["activo"])
    if "empresa_id"in body: updates.append("empresa_id = %s"); params.append(body["empresa_id"] or None)
    if "cc_ids"    in body: updates.append("cc_ids = %s"); params.append(body["cc_ids"] or None)
    if not updates: raise HTTPException(status_code=400, detail="Sin campos a actualizar.")
    params.append(user_id)
    try:
        conn = get_db_connection(); cur = conn.cursor()
        cur.execute(f"UPDATE testing.prof_usuarios SET {', '.join(updates)} WHERE id = %s;", params)
        conn.commit(); cur.close(); conn.close()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/users/{user_id}")
async def api_delete_user(user_id: int, user: dict = Depends(get_current_user)):
    try:
        conn = get_db_connection(); cur = conn.cursor()
        cur.execute("DELETE FROM testing.prof_usuarios WHERE id = %s;", (user_id,))
        conn.commit(); cur.close(); conn.close()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload")
async def api_upload(request: Request, user: dict = Depends(get_current_user)):
    body     = await request.json()
    b64_data = body.get("image","")
    if not b64_data or "," not in b64_data:
        raise HTTPException(status_code=400, detail="Imagen no válida.")
    header, encoded = b64_data.split(",", 1)
    file_ext = "jpg"
    if "png" in header: file_ext = "png"
    elif "webp" in header: file_ext = "webp"
    file_name  = f"img_{int(time.time())}_{uuid.uuid4().hex[:6]}.{file_ext}"
    upload_dir = os.path.join(FRONTEND_DIR, "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    with open(os.path.join(upload_dir, file_name), "wb") as fh:
        fh.write(base64.b64decode(encoded))
    return {"url": f"/uploads/{file_name}"}

# ─── Static Files (sirve el frontend) ────────────────────────────────────────
# Montar archivos estáticos DESPUÉS de todas las rutas API
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

# ─── Entry Point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server_fastapi:app", host="0.0.0.0", port=PORT, reload=False, workers=1)
