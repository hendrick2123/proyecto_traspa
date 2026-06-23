import sys
import server

if __name__ == "__main__":
    ccs = server.get_db_centros_costo()
    print(f"Total registros obtenidos: {len(ccs)}\n")
    print("Muestra de hasta 20 registros:")
    for i, cc in enumerate(ccs[:20]):
        print(f"{i+1}. ID: {cc['id']}, Nombre: {cc['nombre']}, Empresa: {cc['empresaId']}")
