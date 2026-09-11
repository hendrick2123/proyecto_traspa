import sys
sys.stdout.reconfigure(encoding='utf-8')

def search_file(filepath, kw):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        for i, line in enumerate(f, 1):
            if kw.lower() in line.lower():
                print(f"{filepath}:{i}: {line.strip()}")

print("Searching server.py:")
search_file("server.py", "postventa")
print("\nSearching server_fastapi.py:")
search_file("server_fastapi.py", "postventa")
