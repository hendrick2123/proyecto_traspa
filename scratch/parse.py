import re

def parse_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    for i, line in enumerate(lines):
        if line.strip().startswith('@app.'):
            print(f"Line {i+1}: {line.strip()}")
        elif line.strip().startswith('def '):
            print(f"Line {i+1}: {line.strip()}")

if __name__ == '__main__':
    parse_file('c:/Users/Hendrick Ramirez/Desktop/Nueva carpeta (2)/traspa_actualizado/server_fastapi.py')
