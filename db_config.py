import os
import sys
import psycopg2

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
    "host":            os.environ.get("DB_HOST", "localhost"),
    "port":            os.environ.get("DB_PORT", "5432"),
    "dbname":          os.environ.get("DB_NAME", "postgres"),
    "user":            os.environ.get("DB_USER", "postgres"),
    "password":        os.environ.get("DB_PASSWORD", ""),
    "connect_timeout": int(os.environ.get("DB_TIMEOUT", 5))
}

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)
