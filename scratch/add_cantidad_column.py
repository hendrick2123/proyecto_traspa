import os, psycopg2

DB_HOST = os.getenv("DB_HOST", "aws-1-us-east-1.pooler.supabase.com")
DB_PORT = int(os.getenv("DB_PORT", "6543"))
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "hendrick_user.vgxlpfsjruugrdiomjft")
DB_PASSWORD = os.getenv("DB_PASSWORD", "HendrickPostgresData2077!")

# Initial quantities mapped by ID (PV-1 to PV-34)
cantidades = {
    1: 60,   # LOSETA CERAMICA MOD. OXXUS GRIS
    2: 22,   # LOSETA CERAMICA MOD. OXXUS HUESO
    3: 56,   # LOSETA CERAMICA MOD. TIMBERWOOD MARRON
    4: 56,   # LOSETA CERAMICA MOD. TIMBERWOOD BEIGE
    5: 7,    # LOSETA CERAMICA MOD. RINE BLANCO
    6: 3,    # LOSETA CERAMICA MOD. FD MARMOL MIX GRIS
    7: 39,   # LOSETA CERAMICA MOD. SINTRA GRIS
    8: 29,   # LOSETA CERAMICA WILDWOOD NATURA
    9: 40,   # LOSETA CERAMICA LAMBRIN COCINA GRIS/NEGRO color brick
    10: 56,  # LOSETA CERAMICA MOD. LURE BEIGE
    11: 14,  # LOSETA CERAMICA MOD. CITADELLA GRAFITO
    12: 23,  # LOSETA CERAMICA MOD. MATIZ BLANCO
    13: 5,   # LOSETA CERAMICA TIPO TIMBERWOOD CAFÉ
    14: 1,   # VAPORFLEX impermeabilizante resistente al agua
    15: 1,   # PINTURA EXTERIOR
    16: 2,   # PINTURA INTERIOR
    17: 4,   # MANERALES DICA
    18: 1,   # EXTENSIÓN NARANJA 10 MTS
    19: 1,   # MANGUERA PARA JARDIN
    20: 3,   # ADICREST
    21: 1,   # KIT ACCESORIOS TINACO
    22: 1,   # TRAMPA FREGADERO FLEXIBLE
    23: 10,  # SILICÓN TRANSPARENTE
    24: 7,   # SILICÓN BCO PINTABLE
    25: 7,   # REPARADOR DE GRIETAS D70
    26: 1,   # ESCALERA TRUPPER 2.1
    27: 0,   # BULTO APLANADO UNIBLOCK
    28: 0,   # ARNES CUERPO COMPLETO
    29: 0,   # TAPAJUNTA 1.3 MTS
    30: 0,   # PINTURA ESMALTE BCO 19L
    31: 0,   # SILICÓN NEGRO
    32: 0,   # SILICÓN PUERTAS Y VENTANAS
    33: 0,   # SILICÓN TRANSPARENTE
    34: 0    # NO MAS CLAVOS
}

conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD)
cur = conn.cursor()

# 1. Add column cantidad
cur.execute("ALTER TABLE testing.insumos_postventa ADD COLUMN IF NOT EXISTS cantidad NUMERIC DEFAULT 0;")

# 2. Update initial quantities
for item_id, qty in cantidades.items():
    cur.execute("UPDATE testing.insumos_postventa SET cantidad = %s WHERE id = %s;", (qty, item_id))

conn.commit()

# Verify
cur.execute("SELECT id, descripcion, cantidad FROM testing.insumos_postventa ORDER BY id;")
rows = cur.fetchall()
print("Updated testing.insumos_postventa with column 'cantidad':")
for r in rows:
    print(f"PV-{r[0]} | {r[1]} | Cantidad: {r[2]}")

cur.close()
conn.close()
