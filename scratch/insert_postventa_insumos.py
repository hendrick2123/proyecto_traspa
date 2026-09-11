import os
import psycopg2
import sys

DB_HOST = os.getenv("DB_HOST", "aws-1-us-east-1.pooler.supabase.com")
DB_PORT = int(os.getenv("DB_PORT", "6543"))
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "hendrick_user.vgxlpfsjruugrdiomjft")
DB_PASSWORD = os.getenv("DB_PASSWORD", "HendrickPostgresData2077!")

insumos_data = [
    {"descripcion": "LOSETA CERAMICA MOD. OXXUS GRIS", "unidad": "PZA", "especialidad": "CERAMICO", "tipo": "Materiales"},
    {"descripcion": "LOSETA CERAMICA MOD. OXXUS HUESO", "unidad": "PZA", "especialidad": "CERAMICO", "tipo": "Materiales"},
    {"descripcion": "LOSETA CERAMICA MOD. TIMBERWOOD MARRON", "unidad": "PZA", "especialidad": "CERAMICO", "tipo": "Materiales"},
    {"descripcion": "LOSETA CERAMICA MOD. TIMBERWOOD BEIGE", "unidad": "PZA", "especialidad": "CERAMICO", "tipo": "Materiales"},
    {"descripcion": "LOSETA CERAMICA MOD. RINE BLANCO", "unidad": "PZA", "especialidad": "CERAMICO", "tipo": "Materiales"},
    {"descripcion": "LOSETA CERAMICA MOD. FD MARMOL MIX GRIS", "unidad": "PZA", "especialidad": "CERAMICO", "tipo": "Materiales"},
    {"descripcion": "LOSETA CERAMICA MOD. SINTRA GRIS", "unidad": "PZA", "especialidad": "CERAMICO", "tipo": "Materiales"},
    {"descripcion": "LOSETA CERAMICA WILDWOOD NATURA", "unidad": "PZA", "especialidad": "CERAMICO", "tipo": "Materiales"},
    {"descripcion": "LOSETA CERAMICA LAMBRIN COCINA GRIS/NEGRO color brick", "unidad": "PZA", "especialidad": "CERAMICO", "tipo": "Materiales"},
    {"descripcion": "LOSETA CERAMICA MOD. LURE BEIGE", "unidad": "PZA", "especialidad": "CERAMICO", "tipo": "Materiales"},
    {"descripcion": "LOSETA CERAMICA MOD. CITADELLA GRAFITO", "unidad": "PZA", "especialidad": "CERAMICO", "tipo": "Materiales"},
    {"descripcion": "LOSETA CERAMICA MOD. MATIZ BLANCO", "unidad": "PZA", "especialidad": "CERAMICO", "tipo": "Materiales"},
    {"descripcion": "LOSETA CERAMICA TIPO TIMBERWOOD CAFÉ", "unidad": "PZA", "especialidad": "CERAMICO", "tipo": "Materiales"},
    {"descripcion": "VAPORFLEX impermeabilizante resistente al agua", "unidad": "CUBETA", "especialidad": "MATERIAL", "tipo": "Materiales"},
    {"descripcion": "PINTURA EXTERIOR", "unidad": "CUBETA", "especialidad": "MATERIAL", "tipo": "Materiales"},
    {"descripcion": "PINTURA INTERIOR", "unidad": "CUBETA", "especialidad": "MATERIAL", "tipo": "Materiales"},
    {"descripcion": "MANERALES DICA", "unidad": "CAJA", "especialidad": "MATERIAL", "tipo": "Materiales"},
    {"descripcion": "EXTENSIÓN NARANJA 10 MTS", "unidad": "PZA", "especialidad": "MATERIAL", "tipo": "Materiales"},
    {"descripcion": "MANGUERA PARA JARDIN", "unidad": "PZA", "especialidad": "MATERIAL", "tipo": "Materiales"},
    {"descripcion": "ADICREST", "unidad": "BULTO", "especialidad": "MATERIAL", "tipo": "Materiales"},
    {"descripcion": "KIT ACCESORIOS TINACO", "unidad": "BSA", "especialidad": "MATERIAL", "tipo": "Materiales"},
    {"descripcion": "TRAMPA FREGADERO FLEXIBLE", "unidad": "BSA", "especialidad": "MATERIAL", "tipo": "Materiales"},
    {"descripcion": "SILICÓN TRANSPARENTE", "unidad": "PZA", "especialidad": "MATERIAL", "tipo": "Materiales"},
    {"descripcion": "SILICÓN BCO PINTABLE", "unidad": "PZA", "especialidad": "MATERIAL", "tipo": "Materiales"},
    {"descripcion": "REPARADOR DE GRIETAS D70", "unidad": "PZA", "especialidad": "MATERIAL", "tipo": "Materiales"},
    {"descripcion": "ESCALERA TRUPPER 2.1", "unidad": "PZA", "especialidad": "MATERIAL", "tipo": "Materiales"},
    {"descripcion": "BULTO APLANADO UNIBLOCK", "unidad": "BTO", "especialidad": "MATERIAL", "tipo": "Materiales"},
    {"descripcion": "ARNES CUERPO COMPLETO", "unidad": "PZA", "especialidad": "MATERIAL", "tipo": "Materiales"},
    {"descripcion": "TAPAJUNTA 1.3 MTS", "unidad": "PZA", "especialidad": "MATERIAL", "tipo": "Materiales"},
    {"descripcion": "PINTURA ESMALTE BCO 19L", "unidad": "CUBETA", "especialidad": "MATERIAL", "tipo": "Materiales"},
    {"descripcion": "SILICÓN NEGRO", "unidad": "PZA", "especialidad": "MATERIAL", "tipo": "Materiales"},
    {"descripcion": "SILICÓN PUERTAS Y VENTANAS", "unidad": "PZA", "especialidad": "MATERIAL", "tipo": "Materiales"},
    {"descripcion": "SILICÓN TRANSPARENTE", "unidad": "PZA", "especialidad": "MATERIAL", "tipo": "Materiales"},
    {"descripcion": "NO MAS CLAVOS", "unidad": "PZA", "especialidad": "MATERIAL", "tipo": "Materiales"},
]

def main():
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        connect_timeout=10
    )
    cur = conn.cursor()
    
    inserted = 0
    for item in insumos_data:
        cur.execute(
            """
            INSERT INTO testing.insumos_postventa (descripcion, unidad, tipo, especialidad, creado_por)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id;
            """,
            (item["descripcion"], item["unidad"], item["tipo"], item["especialidad"], "sistema")
        )
        new_id = cur.fetchone()[0]
        print(f"Inserted ID: {new_id} - PV-{new_id} : {item['descripcion']}")
        inserted += 1

    conn.commit()
    cur.close()
    conn.close()
    print(f"\nTotal inserted: {inserted}")

if __name__ == "__main__":
    main()
