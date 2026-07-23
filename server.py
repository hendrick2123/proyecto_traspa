import http.server
import socketserver
import json
import os
import urllib.parse
import urllib.request
import sys
import hashlib
import re
import time
import psycopg2

PORT = 8000 # Default, will be updated after reading .env
FRONTEND_DIR = "frontend"
DB_FILE = "db.json"

# Helper to load environment variables from a local .env file
def load_dotenv(filepath=".env"):
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    parts = line.split("=", 1)
                    if len(parts) == 2:
                        key = parts[0].strip()
                        val = parts[1].strip()
                        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                            val = val[1:-1]
                        os.environ[key] = val
        except Exception as e:
            print(f"Warning: Could not read .env file: {e}", file=sys.stderr, flush=True)

# Load configuration values from .env
load_dotenv()

# Override PORT if defined in .env
PORT = int(os.environ.get("PORT", PORT))

# Database Configuration (loaded dynamically from environment or .env)
DB_CONFIG = {
    "host":            os.environ.get("DB_HOST", "localhost"),
    "port":            os.environ.get("DB_PORT", "5432"),
    "dbname":          os.environ.get("DB_NAME", "postgres"),
    "user":            os.environ.get("DB_USER", "postgres"),
    "password":        os.environ.get("DB_PASSWORD", ""),
    "connect_timeout": int(os.environ.get("DB_TIMEOUT", 5))
}

# CORS Configuration (loaded from .env or system environment)
CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in os.environ.get(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:8000,http://127.0.0.1:8000,null"
    ).split(",")
]

# ─── Geo & Browser Restriction Config ────────────────────────────────────────
# Activar/desactivar restricción de geolocalización (default: True)
GEO_RESTRICTION_ENABLED = os.environ.get("GEO_RESTRICTION_ENABLED", "true").lower() == "true"
# Ciudad permitida (default: Mexico City)
GEO_ALLOWED_CITY = os.environ.get("GEO_ALLOWED_CITY", "Mexico City")
# País permitido
GEO_ALLOWED_COUNTRY = os.environ.get("GEO_ALLOWED_COUNTRY", "Mexico")
# Tiempo de caché para la IP verificada (en segundos, default: 5 minutos)
GEO_CACHE_TTL = int(os.environ.get("GEO_CACHE_TTL", 300))
# Caché de IPs verificadas: {ip: (allowed: bool, timestamp)}
GEO_CACHE = {}
# IPs que siempre están permitidas (localhost, desarrollo local)
GEO_WHITELISTED_IPS = {"127.0.0.1", "::1", "localhost"}

# Activar/desactivar restricción de navegador (default: True)
BROWSER_RESTRICTION_ENABLED = os.environ.get("BROWSER_RESTRICTION_ENABLED", "true").lower() == "true"


def check_geo_location(ip_address):
    """Consulta ip-api.com para verificar si la IP es de Ciudad de México.
    Retorna (allowed: bool, info: str)."""
    # IPs locales siempre permitidas
    if ip_address in GEO_WHITELISTED_IPS:
        return True, "IP local (desarrollo)"

    # Revisar caché
    cached = GEO_CACHE.get(ip_address)
    if cached:
        allowed, timestamp = cached
        if time.time() - timestamp < GEO_CACHE_TTL:
            return allowed, "caché"

    try:
        url = f"http://ip-api.com/json/{ip_address}?fields=status,country,city,regionName,query"
        req = urllib.request.Request(url, headers={"User-Agent": "TraspaServer/1.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        if data.get("status") != "success":
            # Si falla la API, permitir acceso (fail-open para no bloquear)
            print(f"Geo: No se pudo verificar IP {ip_address}: {data}", file=sys.stderr, flush=True)
            return True, "API no disponible (fail-open)"

        city = data.get("city", "")
        country = data.get("country", "")
        region = data.get("regionName", "")

        # Verificar si es CDMX (considerar variantes)
        cdmx_variants = ["mexico city", "ciudad de méxico", "ciudad de mexico", "cdmx"]
        is_allowed = (
            city.lower() in cdmx_variants or
            region.lower() in ["ciudad de méxico", "ciudad de mexico", "mexico city", "distrito federal"]
        ) and country.lower() == "mexico"

        # Guardar en caché
        GEO_CACHE[ip_address] = (is_allowed, time.time())

        location_str = f"{city}, {region}, {country}"
        if is_allowed:
            print(f"Geo: Acceso PERMITIDO - IP {ip_address} desde {location_str}", flush=True)
        else:
            print(f"Geo: Acceso BLOQUEADO - IP {ip_address} desde {location_str} (solo CDMX permitido)", flush=True)

        return is_allowed, location_str
    except Exception as e:
        print(f"Geo: Error consultando ubicación de {ip_address}: {e}", file=sys.stderr, flush=True)
        # Fail-open: si hay error de red, permitir acceso
        return True, f"Error de consulta (fail-open): {e}"


def check_browser(user_agent):
    """Verifica que el User-Agent sea de Chrome o Edge.
    Retorna (allowed: bool, browser_name: str)."""
    if not user_agent:
        return False, "Sin User-Agent"

    ua = user_agent.lower()

    # Edge se identifica como "edg/" (no "edge/" en versiones modernas Chromium-based)
    if "edg/" in ua or "edge/" in ua:
        return True, "Microsoft Edge"

    # Chrome: contiene "chrome/" pero NO "opr/" (Opera) ni "edg/" (Edge ya manejado arriba)
    if "chrome/" in ua and "opr/" not in ua:
        return True, "Google Chrome"

    # Detectar qué navegador es para el mensaje de error
    if "firefox/" in ua:
        return False, "Mozilla Firefox"
    elif "safari/" in ua and "chrome/" not in ua:
        return False, "Safari"
    elif "opr/" in ua or "opera" in ua:
        return False, "Opera"
    else:
        return False, "Navegador desconocido"

# ─── Seed Data / Fallback ────────────────────────────────────────────────────
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
  {"id":'CC001',"empresaId":'TOKIO',    "nombre":'Othon Park',         "direccion":'Othon Mendizabal 10'},
  {"id":'CC002',"empresaId":'TOKIO',    "nombre":'Ayanna Tepeyac',     "direccion":'Calz. Guadalupe 386'},
  {"id":'CC003',"empresaId":'TOKIO',    "nombre":'Boleo Park 2',       "direccion":'Boleo 52-A'},
  {"id":'CC004',"empresaId":'TOKIO',    "nombre":'Floresta 1',         "direccion":'Norte 71-2336'},
  {"id":'CC005',"empresaId":'TOKIO',    "nombre":'Vista Jardín',       "direccion":'Calle 15-228'},
  {"id":'CC006',"empresaId":'TOKIO',    "nombre":'Jamaica Park',       "direccion":'Rancho Cruz 46'},
  {"id":'CC007',"empresaId":'TOKIO',    "nombre":'Tokio 616',          "direccion":'CDMX'},
  {"id":'CC008',"empresaId":'TOKIO',    "nombre":'Toltecas 171',       "direccion":'CDMX'},
  {"id":'CC009',"empresaId":'JOGOR',    "nombre":'Alameda Park',       "direccion":'Guerrero 55'},
  {"id":'CC010',"empresaId":'JOGOR',    "nombre":'Oriente 233',        "direccion":'CDMX'},
  {"id":'CC011',"empresaId":'JOGOR',    "nombre":'Calle 4',            "direccion":'CDMX'},
  {"id":'CC012',"empresaId":'MARGOPH',  "nombre":'Vista Aeropuerto',   "direccion":'Norte 5-211'},
  {"id":'CC013',"empresaId":'MARGOPH',  "nombre":'SM Park 3',          "direccion":'Flores Magón 531'},
  {"id":'CC014',"empresaId":'MARGOPH',  "nombre":'Floresta 2',         "direccion":'Poniente 44-3612'},
  {"id":'CC015',"empresaId":'MARGOPH',  "nombre":'Floresta 3',         "direccion":'Poniente 44-3730'},
  {"id":'CC016',"empresaId":'ERATO',    "nombre":'Vértiz Park',        "direccion":'CDMX'},
  {"id":'CC017',"empresaId":'ERATO',    "nombre":'Alameda Park 2',     "direccion":'CDMX'},
  {"id":'CC018',"empresaId":'ERATO',    "nombre":'Vista Norte',        "direccion":'Norte 7A-4934'},
  {"id":'CC019',"empresaId":'ERATO',    "nombre":'Tamagno 121',        "direccion":'CDMX'},
  {"id":'CC020',"empresaId":'LETGAB',   "nombre":'Vitea Gardens',      "direccion":'Querétaro'},
  {"id":'CC021',"empresaId":'LETGAB',   "nombre":'Vista Vértiz',       "direccion":'CDMX'},
  {"id":'CC022',"empresaId":'LETGAB',   "nombre":'Golondrinas 69',     "direccion":'CDMX'},
  {"id":'CC023',"empresaId":'ZIBACASAS',"nombre":'Zintara',            "direccion":'Grijalva 53, Querétaro'},
  {"id":'CC024',"empresaId":'ZIBACASAS',"nombre":'Zircon',             "direccion":'Querétaro'},
  {"id":'CC025',"empresaId":'ZIBACASAS',"nombre":'Monte Denali',       "direccion":'Querétaro'},
  {"id":'CC026',"empresaId":'ZIBACASAS',"nombre":'Monte Himalaya',     "direccion":'Querétaro'},
  {"id":'CC027',"empresaId":'REM',      "nombre":'Res. Eduardo Molina',"direccion":'Eduardo Molina 8132'},
  {"id":'CC028',"empresaId":'ADW',      "nombre":'Sabino Park',        "direccion":'Sabino 530'},
  {"id":'CC029',"empresaId":'SOFITER',  "nombre":'LIV Reforma',        "direccion":'Insurgentes 73'},
]

INSUMOS_DEFAULT = [
  {"id":'INS001',"clave":'MAT-001',"nombre":'Cemento Portland 50kg',      "unidad":'Bulto',      "categoria":'Materiales'},
  {"id":'INS002',"clave":'MAT-002',"nombre":'Varilla 3/8" corrugada',     "unidad":'kg',         "categoria":'Materiales'},
  {"id":'INS003',"clave":'MAT-003',"nombre":'Block 15x20x40',             "unidad":'Pieza',      "categoria":'Materiales'},
  {"id":'INS004',"clave":'MAT-004',"nombre":'Arena lavada',               "unidad":'m³',         "categoria":'Materiales'},
  {"id":'INS005',"clave":'MAT-005',"nombre":'Grava 3/4"',                 "unidad":'m³',         "categoria":'Materiales'},
  {"id":'INS006',"clave":'EQP-001',"nombre":'Mezcladora de concreto',     "unidad":'Equipo',     "categoria":'Equipo'},
  {"id":'INS007',"clave":'EQP-002',"nombre":'Vibrador de concreto',       "unidad":'Equipo',     "categoria":'Equipo'},
  {"id":'INS008',"clave":'EQP-003',"nombre":'Andamio metálico',           "unidad":'Marco',      "categoria":'Equipo'},
  {"id":'INS009',"clave":'HER-001',"nombre":'Carretilla',                 "unidad":'Pieza',      "categoria":'Herramienta'},
  {"id":'INS010',"clave":'HER-002',"nombre":'Pala cuadrada',              "unidad":'Pieza',      "categoria":'Herramienta'},
  {"id":'INS011',"clave":'HER-003',"nombre":'Hilo de cuerda 500m',        "unidad":'Rollo',      "categoria":'Herramienta'},
  {"id":'INS012',"clave":'MAT-006',"nombre":'Tubo PVC 4" sanitario',      "unidad":'Tramo',      "categoria":'Materiales'},
  {"id":'INS013',"clave":'MAT-007',"nombre":'Cable THW-LS 12 AWG',        "unidad":'m',          "categoria":'Materiales'},
  {"id":'INS014',"clave":'MAT-008',"nombre":'Pintura vinílica blanca',    "unidad":'Cubeta 20L', "categoria":'Materiales'},
  {"id":'INS015',"clave":'MAT-009',"nombre":'Impermeabilizante acrílico', "unidad":'Cubeta 20L', "categoria":'Materiales'},
]

DESARROLLOS_DEFAULT = [
  {"id":'TOKIO',    "nombre":'Desarrolladora Tokio SA de CV'},
  {"id":'JOGOR',    "nombre":'Residencial Jogor SA de CV'},
  {"id":'MARGOPH',  "nombre":'Margoph SA de CV'},
  {"id":'ERATO',    "nombre":'Erato Bienes Raíces SA de CV'},
  {"id":'LETGAB',   "nombre":'Letgab SAPI de CV'},
  {"id":'ZIBACASAS',"nombre":'Zibacasas SA de CV'},
  {"id":'REM',      "nombre":'Residencial Eduardo Molina SA de CV'},
  {"id":'ADW',      "nombre":'Desarrolladora ADW SA de CV'},
  {"id":'SOFITER',  "nombre":'Sofiter SA de CV'},
]

# ─── Auth helpers ─────────────────────────────────────────────────────────────
def hash_password(password):
    salted = "gu_salt_2026_" + password
    return hashlib.sha256(salted.encode('utf-8')).hexdigest()

def init_usuarios_table():
    """Crea la tabla prof_usuarios si no existe, migra columna empresa_id y agrega admin por defecto."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur  = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS testing.prof_usuarios (
                id         SERIAL PRIMARY KEY,
                nombre     TEXT NOT NULL,
                correo     TEXT NOT NULL UNIQUE,
                username   TEXT NOT NULL UNIQUE,
                password   TEXT NOT NULL,
                rol        TEXT NOT NULL,
                activo     BOOLEAN DEFAULT TRUE,
                creado_en  TIMESTAMP DEFAULT NOW()
            );
        """)
        # Migración: eliminar check constraint si existe
        cur.execute("ALTER TABLE testing.prof_usuarios DROP CONSTRAINT IF EXISTS prof_usuarios_rol_check;")
        # Migración: agregar empresa_id si no existe
        cur.execute("""
            ALTER TABLE testing.prof_usuarios
            ADD COLUMN IF NOT EXISTS empresa_id TEXT DEFAULT NULL;
        """)
        # Migración: agregar cc_ids (centros de costo asignados) si no existe
        cur.execute("""
            ALTER TABLE testing.prof_usuarios
            ADD COLUMN IF NOT EXISTS cc_ids TEXT DEFAULT NULL;
        """)
        cur.execute("SELECT COUNT(*) FROM testing.prof_usuarios;")
        if cur.fetchone()[0] == 0:
            cur.execute("""
                INSERT INTO testing.prof_usuarios (nombre, correo, username, password, rol)
                VALUES (%s, %s, %s, %s, %s)
            """, ('Administrador', 'admin@grupourban.ia', 'admin', hash_password('admin123'), 'administrador'))
            print("Auth: Usuario admin creado. usuario=admin | password=admin123", flush=True)
        conn.commit()
        cur.close()
        conn.close()
        print("Auth: Tabla prof_usuarios lista (con empresa_id y cc_ids).", flush=True)
    except Exception as e:
        print(f"Auth Warning: {e}", file=sys.stderr, flush=True)

def init_traspasos_tables():
    """Crea las tablas solicitudes_traspasos_v2 y detalle_traspaso_insumos_v2 si no existen."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur  = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS testing.solicitudes_traspasos_v2 (
                id_solicitud SERIAL PRIMARY KEY,                  
                folio VARCHAR(50) NOT NULL UNIQUE,                
                tipo_traspaso VARCHAR(50) NOT NULL,               
                solicitante VARCHAR(100) NOT NULL,                
                estado VARCHAR(30) DEFAULT 'pendiente',
                empresa_origen VARCHAR(100) NULL,
                empresa_destino VARCHAR(100) NULL,
                cc_origen VARCHAR(150) NOT NULL,                  
                cc_destino VARCHAR(150) NOT NULL,                 
                fecha_solicitud TIMESTAMP NOT NULL,                     
                observaciones TEXT NULL,
                autorizador VARCHAR(100) NULL,
                fecha_autorizacion TIMESTAMP NULL,
                comentario_auth TEXT NULL,
                receptor VARCHAR(100) NULL,
                fecha_recepcion TIMESTAMP NULL,
                comentario_rec TEXT NULL
            );
        """)
        # Migración: columnas para segunda autorización (residente)
        cur.execute("ALTER TABLE testing.solicitudes_traspasos_v2 ADD COLUMN IF NOT EXISTS autorizador2 VARCHAR(100) NULL;")
        cur.execute("ALTER TABLE testing.solicitudes_traspasos_v2 ADD COLUMN IF NOT EXISTS fecha_autorizacion2 TIMESTAMP NULL;")
        cur.execute("ALTER TABLE testing.solicitudes_traspasos_v2 ADD COLUMN IF NOT EXISTS comentario_auth2 TEXT NULL;")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS testing.detalle_traspaso_insumos_v2 (
                id_detalle SERIAL PRIMARY KEY,                    
                id_solicitud INT NOT NULL,                        
                clave_insumo VARCHAR(50) NOT NULL,                
                nombre_insumo VARCHAR(150) NOT NULL,              
                cantidad NUMERIC(12, 4) NOT NULL,
                precio NUMERIC(12, 4) DEFAULT 0,
                comentario_insumo TEXT DEFAULT '',
                unidad VARCHAR(20) NOT NULL,                      
                CONSTRAINT fk_solicitud_v2
                    FOREIGN KEY (id_solicitud) 
                    REFERENCES testing.solicitudes_traspasos_v2(id_solicitud) 
                    ON DELETE CASCADE
            );
        """)
        cur.execute("ALTER TABLE testing.detalle_traspaso_insumos_v2 ADD COLUMN IF NOT EXISTS precio NUMERIC(12, 4) DEFAULT 0;")
        cur.execute("ALTER TABLE testing.detalle_traspaso_insumos_v2 ADD COLUMN IF NOT EXISTS comentario_insumo TEXT DEFAULT '';")
        cur.execute("ALTER TABLE testing.detalle_traspaso_insumos_v2 ADD COLUMN IF NOT EXISTS imagen TEXT DEFAULT '';")
        conn.commit()
        cur.close()
        conn.close()
        print("DB: Tablas de traspasos v2 creadas/verificadas (con doble autorización).", flush=True)
    except Exception as e:
        print(f"DB Warning init_traspasos_tables: {e}", file=sys.stderr, flush=True)

# Cache for database catalogs
CATALOG_CACHE = {
    "empresas": None,
    "centros_costo": None,
    "desarrollos": None,
    "insumos": None
}

# ─── DB fetch functions ───────────────────────────────────────────────────────
def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

def get_db_empresas():
    if CATALOG_CACHE["empresas"] is not None:
        return CATALOG_CACHE["empresas"]
    try:
        conn = get_db_connection(); cur = conn.cursor()
        cur.execute("SELECT id_empresa, nombre_empresa FROM testing.prof_empresas GROUP BY id_empresa, nombre_empresa ORDER BY CAST(id_empresa AS INTEGER);")
        rows = cur.fetchall(); cur.close(); conn.close()
        empresas_list = [{"id": r[0], "nombre": r[1], "rfc": ""} for r in rows] if rows else EMPRESAS_DEFAULT.copy()
        if not any(e["id"] == "99" for e in empresas_list):
            empresas_list.append({"id": "99", "nombre": "Almacen", "rfc": ""})
        CATALOG_CACHE["empresas"] = empresas_list
        return CATALOG_CACHE["empresas"]
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
               OR cc.id_cc LIKE '900%'
            ORDER BY cc.nombre_cc;
        """
        cur.execute(query)
        rows = cur.fetchall(); cur.close(); conn.close()
        cc_list = [{"id": r[0], "empresaId": r[1], "nombre": r[2], "direccion": ""} for r in rows] if rows else CC_DEFAULT.copy()
        if not any(c["id"] == "999" for c in cc_list):
            cc_list.append({"id": "999", "empresaId": "99", "nombre": "Almacen", "direccion": ""})
        CATALOG_CACHE["centros_costo"] = cc_list
        return CATALOG_CACHE["centros_costo"]
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
    except Exception as e:
        print(f"DB Warning desarrollos: {e}", file=sys.stderr, flush=True)
        CATALOG_CACHE["desarrollos"] = DESARROLLOS_DEFAULT
        return DESARROLLOS_DEFAULT

def get_db_insumos():
    if CATALOG_CACHE["insumos"] is not None:
        return CATALOG_CACHE["insumos"]
    try:
        conn = get_db_connection(); cur = conn.cursor()
        query = """
            SELECT DISTINCT
                ins.insumo,
                ins.descripcion,
                ins.unidad,
                ins.tipo
            FROM testing.prof_insumos_v2 ins
            ORDER BY ins.descripcion;
        """
        cur.execute(query)
        rows = cur.fetchall(); cur.close(); conn.close()
        CATALOG_CACHE["insumos"] = [{"id": r[0], "clave": r[0], "nombre": r[1], "unidad": r[2] or "—", "categoria": r[3] or "Material"} for r in rows] if rows else INSUMOS_DEFAULT
        return CATALOG_CACHE["insumos"]
    except Exception as e:
        print(f"DB Warning insumos: {e}", file=sys.stderr, flush=True)
        CATALOG_CACHE["insumos"] = INSUMOS_DEFAULT
        return INSUMOS_DEFAULT

# ─── Traspasos Postgres persistence ──────────────────────────────────────────
def get_db_traspasos(conn=None):
    """Lee todos los traspasos y sus insumos desde Postgres y devuelve lista con el mismo
    formato JSON que usa el frontend (campos camelCase)."""
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
            if close_conn:
                conn.close()
            return []

        # Cargar detalles de insumos agrupados por id_solicitud
        cur.execute("""
            SELECT id_solicitud, clave_insumo, nombre_insumo, cantidad, unidad, precio, comentario_insumo, imagen
            FROM testing.detalle_traspaso_insumos_v2
            ORDER BY id_detalle;
        """)
        det_rows = cur.fetchall()
        cur.close()
        if close_conn:
            conn.close()

        # Agrupar items por id_solicitud
        items_map = {}
        for d in det_rows:
            sid = d[0]
            items_map.setdefault(sid, []).append({
                "insumoId":  d[1],
                "nombre":    d[2],
                "cantidad":  float(d[3]),
                "unidad":    d[4],
                "precio":    float(d[5]) if d[5] is not None else 0.0,
                "comentario": d[6] or "",
                "imagen": d[7] or ""
            })

        traspasos = []
        for r in sol_rows:
            sid = r[0]
            traspasos.append({
                "id":                f"DB{sid}",
                "folio":             r[1],
                "tipo":              r[2],
                "solicitante":       r[3],
                "status":            r[4] or "pendiente",
                "empresaOrigen":     r[5] or "",
                "empresaDestino":    r[6] or "",
                "ccOrigen":          r[7],
                "ccDestino":         r[8],
                "fechaSolicitud":    r[9].isoformat() if r[9] else None,
                "observaciones":     r[10] or "",
                "autorizador":       r[11],
                "fechaAutorizacion": r[12].isoformat() if r[12] else None,
                "comentarioAuth":    r[13],
                "receptor":          r[14],
                "fechaRecepcion":    r[15].isoformat() if r[15] else None,
                "comentarioRec":     r[16],
                "autorizador2":      r[17],
                "fechaAutorizacion2":r[18].isoformat() if r[18] else None,
                "comentarioAuth2":   r[19],
                "folioOriginalRef":  r[20] or "",
                "items":             items_map.get(sid, []),
                "_dbId":             sid,
            })
        return traspasos
    except Exception as e:
        print(f"DB Warning get_db_traspasos: {e}", file=sys.stderr, flush=True)
        return []

def save_db_traspaso(t, conn=None):
    """Inserta o actualiza un traspaso y sus insumos en Postgres.
    Usa _dbId para decidir INSERT vs UPDATE y resuelve colisiones de folio."""
    close_conn = False
    try:
        if conn is None:
            conn = get_db_connection()
            close_conn = True
        cur = conn.cursor()

        is_update = "_dbId" in t

        if is_update:
            # UPDATE – actualizar estado y campos de autorización / recepción
            sol_id = t["_dbId"]
            cur.execute("""
                UPDATE testing.solicitudes_traspasos_v2
                SET estado            = %s,
                    autorizador       = %s,
                    fecha_autorizacion = %s,
                    comentario_auth   = %s,
                    receptor          = %s,
                    fecha_recepcion   = %s,
                    comentario_rec    = %s,
                    observaciones     = %s,
                    autorizador2      = %s,
                    fecha_autorizacion2 = %s,
                    comentario_auth2  = %s,
                    folio_original_ref = %s
                WHERE id_solicitud = %s;
            """, (
                t.get("status", "pendiente"),
                t.get("autorizador"),
                t.get("fechaAutorizacion"),
                t.get("comentarioAuth"),
                t.get("receptor"),
                t.get("fechaRecepcion"),
                t.get("comentarioRec"),
                t.get("observaciones", ""),
                t.get("autorizador2"),
                t.get("fechaAutorizacion2"),
                t.get("comentarioAuth2"),
                t.get("folioOriginalRef", None),
                sol_id,
            ))
        else:
            folio_str = t["folio"]
            cur.execute('SELECT id_solicitud FROM testing.solicitudes_traspasos_v2 WHERE folio = %s;', (folio_str,))
            if cur.fetchone():
                # Race condition: folio ya existe, generar uno nuevo seguro
                prefix = t.get("tipo", "PRS")
                max_num = get_max_folio_number(prefix, conn)
                import datetime
                year = datetime.datetime.now().year
                folio_str = f"TRP-{prefix}-{year}-{str(max_num + 1).zfill(4)}"
                t["folio"] = folio_str
                print(f"Colision resuelta: asigne {folio_str}", flush=True)

            # INSERT cabecera
            cur.execute("""
                INSERT INTO testing.solicitudes_traspasos_v2
                    (folio, tipo_traspaso, solicitante, estado,
                     empresa_origen, empresa_destino, cc_origen, cc_destino,
                     fecha_solicitud, observaciones, folio_original_ref)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING id_solicitud;
            """, (
                t["folio"],
                t.get("tipo", "PRS"),
                t.get("solicitante", ""),
                t.get("status", "pendiente"),
                t.get("empresaOrigen", ""),
                t.get("empresaDestino", ""),
                t.get("ccOrigen", ""),
                t.get("ccDestino", ""),
                t.get("fechaSolicitud", None),
                t.get("observaciones", ""),
                t.get("folioOriginalRef", None),
            ))
            sol_id = cur.fetchone()[0]

            # INSERT detalle insumos
            items = t.get("items", [])
            for item in items:
                insumo_id = item.get("insumoId", "")
                nombre = item.get("nombre", "")
                unidad = item.get("unidad", "")

                # Buscar en catálogo si falta nombre o unidad
                if not nombre or not unidad or nombre == insumo_id:
                    try:
                        cur.execute("SELECT descripcion, unidad FROM testing.prof_insumos_v2 WHERE insumo = %s LIMIT 1;", (insumo_id,))
                        row = cur.fetchone()
                        if row:
                            if not nombre or nombre == insumo_id:
                                nombre = row[0]
                            if not unidad:
                                unidad = row[1]
                    except Exception as e:
                        print(f"DB Error lookup insumo {insumo_id}: {e}", flush=True)

                if not nombre:
                    nombre = insumo_id
                if not unidad:
                    unidad = "Pieza"

                precio_val = item.get("precio", 0.0)
                comentario_val = item.get("comentario", "")
                imagen_val = item.get("imagen", "")
                print(f"  DB INSERT detalle: clave={insumo_id} cant={item.get('cantidad',0)} precio={precio_val} comentario='{comentario_val[:30]}' imagen={'SI' if imagen_val else 'NO'}", flush=True)
                cur.execute("""
                    INSERT INTO testing.detalle_traspaso_insumos_v2
                        (id_solicitud, clave_insumo, nombre_insumo, cantidad, unidad, precio, comentario_insumo, imagen)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s);
                """, (
                    sol_id,
                    insumo_id,
                    nombre,
                    item.get("cantidad", 0),
                    unidad,
                    precio_val,
                    comentario_val,
                    imagen_val
                ))

        conn.commit()
        cur.close()
        if close_conn:
            conn.close()
        return sol_id
    except Exception as e:
        print(f"DB Error save_db_traspaso ({t.get('folio','?')}): {e}", file=sys.stderr, flush=True)
        return None

def get_max_folio_number(prefix, conn=None):
    """Obtiene el número máximo de folio numérico para un prefijo (PRS, TOB, DEV, GAR) desde Postgres."""
    close_conn = False
    try:
        if conn is None:
            conn = get_db_connection()
            close_conn = True
        cur = conn.cursor()
        cur.execute("""
            SELECT MAX(CAST(SPLIT_PART(folio, '-', 4) AS INTEGER))
            FROM testing.solicitudes_traspasos_v2
            WHERE folio LIKE %s;
        """, (f"TRP-{prefix}-%",))
        row = cur.fetchone()
        cur.close()
        if close_conn:
            conn.close()
        if row and row[0] is not None:
            return int(row[0])
        return 0
    except Exception as e:
        print(f"DB Warning get_max_folio: {e}", file=sys.stderr, flush=True)
        return 0

# Active user sessions store (token: user_data)
ACTIVE_SESSIONS = {}

# ─── Server Request Handler ───────────────────────────────────────────────────
class WarehouseTransferHandler(http.server.BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        # Log limpio sin emojis (compatible Windows)
        print(f"  [{self.command}] {self.path} -> {args[1]}", flush=True)

    def end_headers(self):
        origin = self.headers.get('Origin')
        if origin in CORS_ALLOWED_ORIGINS:
            self.send_header('Access-Control-Allow-Origin', origin)
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def _read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        return json.loads(self.rfile.read(length).decode('utf-8'))

    def _json(self, code, data):
        body = json.dumps(data, ensure_ascii=False, default=str).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(body)

    def _get_authenticated_user(self):
        auth_header = self.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
        token = auth_header.split(' ', 1)[1].strip()
        return ACTIVE_SESSIONS.get(token)

    def _get_client_ip(self):
        """Obtiene la IP real del cliente considerando proxies."""
        # Revisar headers de proxy
        forwarded = self.headers.get('X-Forwarded-For')
        if forwarded:
            return forwarded.split(',')[0].strip()
        real_ip = self.headers.get('X-Real-IP')
        if real_ip:
            return real_ip.strip()
        return self.client_address[0]

    def _check_access_restrictions(self):
        """Valida restricciones de geolocalización y navegador.
        Retorna True si el acceso es permitido, False si fue bloqueado (ya envió respuesta)."""
        path = urllib.parse.urlparse(self.path).path

        # No restringir preflight CORS
        if self.command == 'OPTIONS':
            return True

        # 1. Verificar navegador
        if BROWSER_RESTRICTION_ENABLED:
            user_agent = self.headers.get('User-Agent', '')
            browser_ok, browser_name = check_browser(user_agent)

            # Permitir requests de APIs (fetch/XHR) sin importar el navegador
            # Solo bloquear navegación de páginas HTML
            is_page_request = path.endswith('.html') or path == '/' or (
                not path.startswith('/api/') and '.' not in path.split('/')[-1]
            )

            if not browser_ok and is_page_request:
                self._send_blocked_page(
                    "Navegador No Permitido",
                    f"Se detectó: <strong>{browser_name}</strong>",
                    "Esta aplicación solo puede ser accedida desde <strong>Google Chrome</strong> o <strong>Microsoft Edge</strong>.",
                    "Abre esta dirección en Chrome o Edge para continuar."
                )
                return False

        # 2. Verificar geolocalización
        if GEO_RESTRICTION_ENABLED:
            client_ip = self._get_client_ip()
            geo_ok, geo_info = check_geo_location(client_ip)

            if not geo_ok:
                self._send_blocked_page(
                    "Acceso Restringido por Ubicación",
                    f"Tu ubicación detectada: <strong>{geo_info}</strong>",
                    "Esta aplicación solo está disponible para acceso desde <strong>Ciudad de México (CDMX)</strong>.",
                    "Si crees que esto es un error, contacta al administrador del sistema."
                )
                return False

        return True

    def _send_blocked_page(self, title, detail, message, hint):
        """Envía una página HTML de error elegante para accesos bloqueados."""
        html = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} - Grupo Urbania</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #2d1b4e 100%);
      color: #fff;
      padding: 20px;
    }}
    .container {{
      max-width: 520px;
      width: 100%;
      text-align: center;
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px;
      padding: 48px 40px;
      box-shadow: 0 25px 80px rgba(0,0,0,0.4);
    }}
    .icon {{
      width: 80px; height: 80px;
      background: rgba(231,76,60,0.15);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 24px;
      font-size: 36px;
    }}
    h1 {{
      font-size: 22px;
      font-weight: 800;
      margin-bottom: 12px;
      color: #ff6b6b;
    }}
    .detail {{
      font-size: 13px;
      color: rgba(255,255,255,0.5);
      margin-bottom: 20px;
      padding: 8px 16px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      display: inline-block;
    }}
    .message {{
      font-size: 15px;
      color: rgba(255,255,255,0.8);
      line-height: 1.6;
      margin-bottom: 24px;
    }}
    .hint {{
      font-size: 12px;
      color: rgba(255,255,255,0.4);
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }}
    .brand {{
      margin-top: 32px;
      font-size: 11px;
      font-weight: 600;
      color: rgba(255,255,255,0.2);
      letter-spacing: 2px;
      text-transform: uppercase;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🛡️</div>
    <h1>{title}</h1>
    <div class="detail">{detail}</div>
    <div class="message">{message}</div>
    <div class="hint">{hint}</div>
    <div class="brand">Grupo Urbania &middot; Sistema de Traspasos</div>
  </div>
</body>
</html>"""
        self.send_response(403)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))

    # ── GET ──────────────────────────────────────────────────────────────────
    def do_GET(self):
        if not self._check_access_restrictions():
            return
        path = urllib.parse.urlparse(self.path).path

        # ── GET /api/public/empresas (Public) ──
        if path == '/api/public/empresas':
            self._json(200, {"empresas": get_db_empresas()})
            return

        # ── GET /api/public/centros_costo (Public - para registro) ──
        if path == '/api/public/centros_costo':
            self._json(200, {"centrosCosto": get_db_centros_costo()})
            return

        # ── GET /api/state ──
        if path == '/api/state':
            user = self._get_authenticated_user()
            if not user:
                self._json(401, {"error": "No autorizado. Inicie sesión nuevamente."})
                return
            empresas      = get_db_empresas()
            centros_costo = get_db_centros_costo()
            insumos       = get_db_insumos()
            desarrollos   = get_db_desarrollos()

            # Usar una sola conexión para traspasos + folios
            try:
                pg_conn = get_db_connection()
            except Exception as e:
                print(f"DB Error connecting: {e}", file=sys.stderr, flush=True)
                pg_conn = None

            # Cargar traspasos desde Postgres
            traspasos = get_db_traspasos(conn=pg_conn)

            # Calcular folios basados en los registros existentes en DB
            folio_prs = get_max_folio_number("PRS", conn=pg_conn)
            folio_tob = get_max_folio_number("TOB", conn=pg_conn)
            folio_dev = get_max_folio_number("DEV", conn=pg_conn)
            folio_gar = get_max_folio_number("GAR", conn=pg_conn)
            folios = {"PRS": folio_prs, "TOB": folio_tob, "DEV": folio_dev, "GAR": folio_gar}

            if pg_conn:
                try:
                    pg_conn.close()
                except Exception:
                    pass

            # Merge datos locales extras (empresas/CC/insumos que no están en Postgres)
            if os.path.exists(DB_FILE):
                try:
                    with open(DB_FILE, 'r', encoding='utf-8') as f:
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

            # ── Filtrar traspasos según rol y cc_ids del usuario ──
            user_rol = user.get('rol', '')
            if user_rol not in ('administrador', 'residente', 'cordinador'):
                user_cc_ids = [c.strip() for c in (user.get('cc_ids') or '').split(',') if c.strip()]
                user_empresa_ids = [e.strip() for e in (user.get('empresa_id') or '').split(',') if e.strip()]
                if user_cc_ids:
                    filtered = []
                    for t in traspasos:
                        cc_ori = t.get('ccOrigen', '')
                        cc_des = t.get('ccDestino', '')
                        sol_nombre = t.get('solicitante', '')
                        if cc_ori in user_cc_ids or cc_des in user_cc_ids:
                            filtered.append(t)
                        elif sol_nombre == user.get('nombre', ''):
                            filtered.append(t)
                    traspasos = filtered
                elif user_empresa_ids:
                    # Fallback: filtrar por empresa si no tiene cc_ids asignados
                    filtered = []
                    for t in traspasos:
                        cc_ori_obj = next((c for c in centros_costo if c['id'] == t.get('ccOrigen', '')), None)
                        cc_des_obj = next((c for c in centros_costo if c['id'] == t.get('ccDestino', '')), None)
                        ori_emp = cc_ori_obj['empresaId'] if cc_ori_obj else t.get('empresaOrigen', '')
                        des_emp = cc_des_obj['empresaId'] if cc_des_obj else t.get('empresaDestino', '')
                        if ori_emp in user_empresa_ids or des_emp in user_empresa_ids:
                            filtered.append(t)
                    traspasos = filtered

            self._json(200, {
                "empresas": empresas, "centrosCosto": centros_costo,
                "insumos": insumos,   "desarrollos": desarrollos,
                "traspasos": traspasos, "folios": folios
            })
            return

        # ── GET /api/users ──
        if path == '/api/users':
            user = self._get_authenticated_user()
            if not user:
                self._json(401, {"error": "No autorizado. Inicie sesión nuevamente."})
                return
            try:
                conn = get_db_connection(); cur = conn.cursor()
                cur.execute("""
                    SELECT id, nombre, correo, username, rol, activo, creado_en, empresa_id, cc_ids
                    FROM testing.prof_usuarios
                    ORDER BY id;
                """)
                cols  = ['id','nombre','correo','username','rol','activo','creado_en','empresa_id','cc_ids']
                users = [dict(zip(cols, row)) for row in cur.fetchall()]
                cur.close(); conn.close()
                self._json(200, {"users": users})
            except Exception as e:
                self._json(500, {"error": str(e)})
            return

        # ── Static files ──
        clean_path = '/' if path == '/' else path
        if clean_path == '/':
            clean_path = '/login.html'  # redirige raíz al login

        local_file = os.path.join(FRONTEND_DIR, clean_path.lstrip('/'))
        if os.path.exists(local_file) and os.path.isfile(local_file):
            ext = os.path.splitext(local_file)[1].lower()
            mime = {
                '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
                '.js':'application/javascript; charset=utf-8', '.json':'application/json; charset=utf-8',
                '.png':'image/png', '.jpg':'image/jpeg', '.gif':'image/gif',
                '.svg':'image/svg+xml', '.ico':'image/x-icon',
            }.get(ext, 'application/octet-stream')
            self.send_response(200)
            self.send_header('Content-Type', mime)
            self.end_headers()
            with open(local_file, 'rb') as f:
                self.wfile.write(f.read())
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"Not Found: {clean_path}".encode())

    # ── POST ─────────────────────────────────────────────────────────────────
    def do_POST(self):
        if not self._check_access_restrictions():
            return
        path = urllib.parse.urlparse(self.path).path

        # ── POST /api/auth/login ──
        if path == '/api/auth/login':
            try:
                body = self._read_body()
                username = body.get('username', '').strip()
                password = body.get('password', '')
                if not username or not password:
                    self._json(400, {"error": "Usuario y contraseña requeridos."}); return

                conn = get_db_connection(); cur = conn.cursor()
                cur.execute("""
                    SELECT id, nombre, correo, username, rol, activo, empresa_id, cc_ids
                    FROM testing.prof_usuarios
                    WHERE username = %s AND password = %s
                """, (username, hash_password(password)))
                row = cur.fetchone(); cur.close(); conn.close()

                if not row:
                    self._json(401, {"error": "Usuario o contraseña incorrectos."}); return
                if not row[5]:
                    self._json(403, {"error": "Tu cuenta está desactivada. Contacta al administrador."}); return

                user = {"id": row[0], "nombre": row[1], "correo": row[2], "username": row[3], "rol": row[4], "empresa_id": row[6], "cc_ids": row[7]}
                print(f"Auth: Login exitoso - {username} ({row[4]}) empresa={row[6]}", flush=True)
                
                # Generar token de sesión seguro
                token = hashlib.sha256(os.urandom(16)).hexdigest()
                ACTIVE_SESSIONS[token] = user

                self._json(200, {"user": user, "token": token})
            except Exception as e:
                self._json(500, {"error": str(e)})
            return

        # ── POST /api/auth/register ──
        if path == '/api/auth/register':
            try:
                body       = self._read_body()
                nombre     = body.get('nombre', '').strip()
                username   = body.get('username', '').strip()
                correo     = body.get('correo', '').strip()
                rol        = body.get('rol', '').strip()
                password   = body.get('password', '')
                empresa_id = body.get('empresa_id', None)  # puede ser None para admin
                cc_ids     = body.get('cc_ids', None)       # centros de costo asignados (comma-separated)
                roles_validos = {'almacenista', 'control_obra', 'residente', 'administrador', 'cordinador'}

                if not all([nombre, username, correo, rol, password]):
                    self._json(400, {"error": "Todos los campos son obligatorios."}); return
                if rol not in roles_validos:
                    self._json(400, {"error": "Rol inválido."}); return
                if len(password) < 6:
                    self._json(400, {"error": "La contraseña debe tener al menos 6 caracteres."}); return
                if rol not in ('administrador', 'residente', 'cordinador') and not empresa_id:
                    self._json(400, {"error": "Debes seleccionar la empresa a la que perteneces."}); return
                if rol not in ('administrador', 'residente', 'cordinador') and not cc_ids:
                    self._json(400, {"error": "Debes seleccionar al menos un centro de costo."}); return

                conn = get_db_connection(); cur = conn.cursor()
                cur.execute("""
                    INSERT INTO testing.prof_usuarios (nombre, correo, username, password, rol, empresa_id, cc_ids)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id;
                """, (nombre, correo, username, hash_password(password), rol, empresa_id or None, cc_ids or None))
                new_id = cur.fetchone()[0]
                conn.commit(); cur.close(); conn.close()
                print(f"Auth: Nuevo usuario registrado - {username} ({rol}) empresa={empresa_id} cc_ids={cc_ids}", flush=True)
                self._json(201, {"ok": True, "id": new_id})
            except psycopg2.errors.UniqueViolation:
                self._json(409, {"error": "El usuario o correo ya está registrado."})
            except Exception as e:
                self._json(500, {"error": str(e)})
            return

        # ── POST /api/state ──
        if path == '/api/state':
            user = self._get_authenticated_user()
            if not user:
                self._json(401, {"error": "No autorizado. Inicie sesión nuevamente."})
                return
            try:
                state_data     = self._read_body()
                official_emp   = get_db_empresas()
                official_ccs   = get_db_centros_costo()
                official_ins   = get_db_insumos()

                # ── Sincronizar traspasos a Postgres (una sola conexión) ──
                incoming_traspasos = state_data.get("traspasos", [])
                saved_count = 0
                pg_conn = None
                try:
                    pg_conn = get_db_connection()
                    for t in incoming_traspasos:
                        folio = t.get("folio", "")
                        if folio:  # Solo guardar los que tienen folio válido
                            result = save_db_traspaso(t, conn=pg_conn)
                            if result is not None:
                                saved_count += 1
                except Exception as e:
                    print(f"DB Error sync traspasos: {e}", file=sys.stderr, flush=True)
                finally:
                    if pg_conn:
                        try:
                            pg_conn.close()
                        except Exception:
                            pass
                print(f"Server: {saved_count}/{len(incoming_traspasos)} traspasos sincronizados a Postgres.", flush=True)

                # Guardar datos locales extras en db.json (sin traspasos, esos ya están en PG)
                local_db = {
                    "empresas":    [e for e in state_data.get("empresas", []) if not any(oe["id"] == e["id"] for oe in official_emp)],
                    "centrosCosto":[c for c in state_data.get("centrosCosto", []) if not any(oc["id"] == c["id"] for oc in official_ccs)],
                    "insumos":     [i for i in state_data.get("insumos", []) if not any(oi["id"] == i["id"] for oi in official_ins)],
                }
                with open(DB_FILE, 'w', encoding='utf-8') as f:
                    json.dump(local_db, f, indent=2, ensure_ascii=False)
                self._json(200, {"status": "success"})
                print("Server: Estado guardado en db.json + Postgres.", flush=True)
            except Exception as e:
                self._json(500, {"error": str(e)})
                print(f"Server Error: {e}", file=sys.stderr, flush=True)
            return

        # ── POST /api/upload ──
        if path == '/api/upload':
            user = self._get_authenticated_user()
            if not user:
                self._json(401, {"error": "No autorizado. Inicie sesión nuevamente."})
                return
            try:
                body = self._read_body()
                b64_data = body.get('image', '')
                if not b64_data or ',' not in b64_data:
                    self._json(400, {"error": "Imagen no válida."})
                    return
                
                header, encoded = b64_data.split(',', 1)
                import base64
                import time
                import uuid
                file_ext = "jpg"
                if "png" in header: file_ext = "png"
                elif "webp" in header: file_ext = "webp"
                
                file_name = f"img_{int(time.time())}_{uuid.uuid4().hex[:6]}.{file_ext}"
                upload_dir = os.path.join(FRONTEND_DIR, 'uploads')
                os.makedirs(upload_dir, exist_ok=True)
                file_path = os.path.join(upload_dir, file_name)
                
                with open(file_path, "wb") as fh:
                    fh.write(base64.b64decode(encoded))
                    
                self._json(200, {"url": f"/uploads/{file_name}"})
            except Exception as e:
                print(f"Error en upload: {e}", file=sys.stderr, flush=True)
                self._json(500, {"error": str(e)})
            return

        self._json(404, {"error": "Endpoint no encontrado."})

    # ── PUT ──────────────────────────────────────────────────────────────────
    def do_PUT(self):
        if not self._check_access_restrictions():
            return
        path = urllib.parse.urlparse(self.path).path

        # ── PUT /api/users/<id> ──
        if path.startswith('/api/users/'):
            user = self._get_authenticated_user()
            if not user:
                self._json(401, {"error": "No autorizado. Inicie sesión nuevamente."})
                return
            try:
                user_id = int(path.split('/')[-1])
                body    = self._read_body()
                updates = []
                params  = []
                if 'nombre' in body:
                    nombre = body['nombre'].strip()
                    if not nombre:
                        self._json(400, {"error": "El nombre no puede estar vacío."}); return
                    updates.append("nombre = %s"); params.append(nombre)
                if 'password' in body:
                    pwd = body['password']
                    if pwd:  # Solo actualizar si viene con valor
                        if len(pwd) < 6:
                            self._json(400, {"error": "La contraseña debe tener al menos 6 caracteres."}); return
                        updates.append("password = %s"); params.append(hash_password(pwd))
                if 'rol' in body:
                    updates.append("rol = %s"); params.append(body['rol'])
                if 'activo' in body:
                    updates.append("activo = %s"); params.append(body['activo'])
                if 'empresa_id' in body:
                    updates.append("empresa_id = %s"); params.append(body['empresa_id'] or None)
                if 'cc_ids' in body:
                    updates.append("cc_ids = %s"); params.append(body['cc_ids'] or None)
                if not updates:
                    self._json(400, {"error": "Sin campos a actualizar."}); return
                params.append(user_id)

                conn = get_db_connection(); cur = conn.cursor()
                cur.execute(f"UPDATE testing.prof_usuarios SET {', '.join(updates)} WHERE id = %s;", params)
                conn.commit(); cur.close(); conn.close()
                self._json(200, {"ok": True})
            except Exception as e:
                self._json(500, {"error": str(e)})
            return

        self._json(404, {"error": "Endpoint no encontrado."})

    # ── DELETE ───────────────────────────────────────────────────────────────
    def do_DELETE(self):
        if not self._check_access_restrictions():
            return
        path = urllib.parse.urlparse(self.path).path
        if path.startswith('/api/users/'):
            user = self._get_authenticated_user()
            if not user:
                self._json(401, {"error": "No autorizado. Inicie sesión nuevamente."})
                return
            try:
                user_id = int(path.split('/')[-1])
                conn = get_db_connection(); cur = conn.cursor()
                cur.execute("DELETE FROM testing.prof_usuarios WHERE id = %s;", (user_id,))
                conn.commit(); cur.close(); conn.close()
                self._json(200, {"ok": True})
            except Exception as e:
                self._json(500, {"error": str(e)})
            return
        self._json(404, {"error": "Endpoint no encontrado."})


# ─── Run ─────────────────────────────────────────────────────────────────────
def run_server():
    init_usuarios_table()
    init_traspasos_tables()
    
    # Pre-cargar catálogos para evitar lentitud en peticiones
    print("DB: Pre-cargando catálogos de base de datos...", flush=True)
    get_db_empresas()
    get_db_centros_costo()
    get_db_desarrollos()
    get_db_insumos()
    print("DB: Catálogos pre-cargados exitosamente.", flush=True)
    
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), WarehouseTransferHandler) as httpd:
        print(f"\n=======================================================", flush=True)
        print(f" Servidor levantado en: http://localhost:{PORT}", flush=True)
        print(f" Login:    http://localhost:{PORT}/login.html", flush=True)
        print(f" Registro: http://localhost:{PORT}/register.html", flush=True)
        print(f"-------------------------------------------------------", flush=True)
        print(f" Restriccion Geo:      {'ACTIVADA (solo CDMX)' if GEO_RESTRICTION_ENABLED else 'DESACTIVADA'}", flush=True)
        print(f" Restriccion Browser:  {'ACTIVADA (Chrome/Edge)' if BROWSER_RESTRICTION_ENABLED else 'DESACTIVADA'}", flush=True)
        print(f"=======================================================\n", flush=True)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido.", flush=True)
            httpd.server_close()

if __name__ == '__main__':
    run_server()
