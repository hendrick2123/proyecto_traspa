import ast
import sys

with open('server_fastapi.py', 'r', encoding='utf-8') as f:
    code = f.read()

tree = ast.parse(code)

for node in ast.walk(tree):
    if isinstance(node, ast.FunctionDef):
        for child in ast.walk(node):
            if isinstance(child, ast.Call) and getattr(child.func, 'id', '') == 'get_db_connection':
                # Found a call, let's see if this function has a Try with finally that closes it
                has_finally = False
                for try_node in ast.walk(node):
                    if isinstance(try_node, ast.Try):
                        if try_node.finalbody:
                            has_finally = True
                            break
                if not has_finally:
                    print(f'Function {node.name} calls get_db_connection but has no finally block!')
