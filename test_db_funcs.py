import psycopg2
from server import get_db_traspasos, init_traspasos_tables

print("Probando conexion directa y funciones DB...")
try:
    init_traspasos_tables()
    traspasos = get_db_traspasos()
    print("Traspasos cargados con éxito:")
    print(traspasos)
except Exception as e:
    print("ERROR:", e)
