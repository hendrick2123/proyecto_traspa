import os

PORT = int(os.environ.get("PORT", 8000))
FRONTEND_DIR = "frontend"
DB_FILE = "db.json"
SESSIONS_FILE = "sessions.json"

CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in os.environ.get(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:8000,http://127.0.0.1:8000"
    ).split(",") if origin.strip() and origin.strip() != "null"
]

GEO_RESTRICTION_ENABLED  = os.environ.get("GEO_RESTRICTION_ENABLED", "true").lower() == "true"
GEO_ALLOWED_CITY         = os.environ.get("GEO_ALLOWED_CITY", "Mexico City")
GEO_ALLOWED_COUNTRY      = os.environ.get("GEO_ALLOWED_COUNTRY", "Mexico")
GEO_CACHE_TTL            = int(os.environ.get("GEO_CACHE_TTL", 300))
BROWSER_RESTRICTION_ENABLED = os.environ.get("BROWSER_RESTRICTION_ENABLED", "true").lower() == "true"

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
