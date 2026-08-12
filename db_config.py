import os
import sys
import psycopg2
from psycopg2 import pool
from contextlib import contextmanager

def load_dotenv(filepath=None):
    if filepath is None:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        filepath = os.path.join(base_dir, ".env")
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

load_dotenv()

DB_CONFIG = {
    "host":                os.environ.get("DB_HOST", "localhost"),
    "port":                os.environ.get("DB_PORT", "5432"),
    "dbname":              os.environ.get("DB_NAME", "postgres"),
    "user":                os.environ.get("DB_USER", "postgres"),
    "password":            os.environ.get("DB_PASSWORD", ""),
    "connect_timeout":     int(os.environ.get("DB_TIMEOUT", 5)),
    "keepalives":          1,
    "keepalives_idle":     30,
    "keepalives_interval": 10,
    "keepalives_count":    3,
    "options":             "-c statement_timeout=60000"
}

# Inicialización de un pool de conexiones para soportar alta concurrencia
# maxconn reducido a 10 por defecto (configurable) para evitar agotar conexiones
# cuando uvicorn corre con múltiples workers (cada worker tiene su propio pool)
DB_MAX_CONN = int(os.environ.get("DB_MAX_CONN", 10))
try:
    connection_pool = psycopg2.pool.ThreadedConnectionPool(
        minconn=1,
        maxconn=DB_MAX_CONN,
        **DB_CONFIG
    )
except (Exception, psycopg2.DatabaseError) as error:
    print("Error al inicializar el pool de conexiones:", error, file=sys.stderr)
    connection_pool = None

@contextmanager
def get_db_connection_ctx():
    """Context manager para obtener una conexión del pool y devolverla automáticamente."""
    conn = None
    try:
        if connection_pool:
            conn = connection_pool.getconn()
        else:
            conn = psycopg2.connect(**DB_CONFIG)
        yield conn
    finally:
        if conn and connection_pool:
            connection_pool.putconn(conn)

class PooledConnectionWrapper:
    def __init__(self, conn, pool_obj):
        self._conn = conn
        self._pool = pool_obj

    def close(self):
        if self._pool and self._conn:
            try:
                self._pool.putconn(self._conn)
            except Exception:
                pass

    def __getattr__(self, item):
        return getattr(self._conn, item)

def get_db_connection(retries=3):
    """
    Mantiene compatibilidad hacia atrás con scripts existentes.
    Obtiene una conexión del pool envuelta en PooledConnectionWrapper para que conn.close()
    devuelva la conexión al pool de forma segura.
    """
    last_err = None
    for attempt in range(retries):
        try:
            if connection_pool:
                raw_conn = connection_pool.getconn()
                return PooledConnectionWrapper(raw_conn, connection_pool)
            else:
                return psycopg2.connect(**DB_CONFIG)
        except Exception as e:
            last_err = e
            print(f"[DB WARN] Intento {attempt + 1}/{retries} falló: {e}", file=sys.stderr, flush=True)
            if attempt < retries - 1:
                import time
                time.sleep(1)
    raise last_err

def release_db_connection(conn):
    """Ayudante para código legacy que necesita devolver la conexión manualmente."""
    if connection_pool and conn:
        connection_pool.putconn(conn)
    elif conn:
        conn.close()
