from server_fastapi import get_db_traspasos_paginated

def main():
    user = {"username": "JRIOS", "nombre": "JESSICA ROSALES RIOS", "rol": "cordinador"}
    
    print("Testing CC='412' filter with get_db_traspasos_paginated:")
    traspasos, total = get_db_traspasos_paginated(page=1, limit=25, cc="412", user=user)
    print(f"Result count: {len(traspasos)}, Total count: {total}")
    for t in traspasos[:5]:
        print(f"  ID: {t['id']} | Folio: {t['folio']} | Origen: {t['ccOrigen']} | Destino: {t['ccDestino']}")

if __name__ == '__main__':
    main()
