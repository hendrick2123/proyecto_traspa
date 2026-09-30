import re

funcs = [
    'get_db_insumos', 'get_db_traspasos', 'get_db_traspasos_paginated',
    'save_db_traspaso', 'get_max_folio_number', 'init_db',
    'api_get_folios', 'api_get_state'
]

with open('server_fastapi.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for func in funcs:
    start_idx = -1
    for i, line in enumerate(lines):
        if line.startswith(f'def {func}(') or line.startswith(f'async def {func}('):
            start_idx = i
            break
    if start_idx == -1:
        continue
    
    # Find the end of the try block or where the function ends
    end_idx = start_idx
    indent = len(lines[start_idx]) - len(lines[start_idx].lstrip())
    
    # Simple heuristic: find the except block and where it ends
    except_idx = -1
    for i in range(start_idx + 1, len(lines)):
        if lines[i].strip() == '' or lines[i].isspace():
            continue
        line_indent = len(lines[i]) - len(lines[i].lstrip())
        if line_indent <= indent:
            end_idx = i - 1
            break
        if lines[i].strip().startswith('except '):
            except_idx = i
    if end_idx == start_idx: end_idx = len(lines) - 1
    
    print(f'--- {func} (ends around line {end_idx + 1}) ---')
    print(''.join(lines[end_idx-3:end_idx+2]))
