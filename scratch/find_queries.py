import sys
sys.stdout.reconfigure(encoding='utf-8')

def find_queries(filepath):
    print(f"=== Queries in {filepath} ===")
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
        for i, l in enumerate(lines, 1):
            if any(t in l.lower() for t in ['historial_postventa', 'insumos_postventa', 'detalle_traspaso_insumos_v2']):
                print(f"Line {i}: {l.strip()}")

find_queries("server.py")
print()
find_queries("server_fastapi.py")
