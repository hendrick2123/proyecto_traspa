import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db_config import get_db_connection

try:
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 1. Restore record ID 6 observation
    cur.execute("""
        UPDATE testing.solicitudes_traspasos_v2
        SET observaciones = %s
        WHERE id_solicitud = 6;
    """, ('POR URGENCIA DE OBRA, MEDIA TONELADA DE CEMENTO GRIS',))
    print("Record ID 6 restaurado.")

    # 2. Check current max PRS folio
    cur.execute("SELECT MAX(CAST(SPLIT_PART(folio, '-', 4) AS INTEGER)) FROM testing.solicitudes_traspasos_v2 WHERE folio LIKE 'TRP-PRS-%';")
    max_num = cur.fetchone()[0] or 12
    next_num = max_num + 1
    new_folio = f"TRP-PRS-2026-{String(next_num).zfill(4)}" if False else f"TRP-PRS-2026-{next_num:04d}"

    # Insert the separate request for 2 Rompedoras with fresh folio
    cur.execute("""
        INSERT INTO testing.solicitudes_traspasos_v2
            (folio, tipo_traspaso, solicitante, estado, empresa_origen, empresa_destino,
             cc_origen, cc_destino, fecha_solicitud, observaciones)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), %s)
        RETURNING id_solicitud;
    """, (
        new_folio, 'PRS', 'OSCAR UZIEL LARA MATA', 'pendiente_cordinador',
        'DESARROLLADORA TOKIO, S.A. DE C.V.', 'ERATO BIENES RAICES',
        'JAMAICA PARK COSTO DIRECTO', 'ALAMEDA PARK 2 COSTO DIRECTO',
        '2 ROMPEDORAS DE 30KG POR URGENCIA DE OBRA: DEMOLICIÓN DE BANQUETA'
    ))
    new_id = cur.fetchone()[0]
    print(f"Creada nueva solicitud separada para 2 Rompedoras con id {new_id} y folio {new_folio}.")

    # Add item for 2 Rompedoras
    cur.execute("""
        INSERT INTO testing.detalle_traspaso_insumos_v2
            (id_solicitud, clave_insumo, nombre_insumo, cantidad, unidad, precio, comentario_insumo)
        VALUES (%s, %s, %s, %s, %s, %s, %s);
    """, (new_id, 'ROMPEDORA-30KG', 'ROMPEDORA DE 30KG', 2.0, 'PZA', 0.0, '2 ROMPEDORAS DE 30KG'))
    print("Insumo de 2 Rompedoras insertado.")

    conn.commit()
    cur.close()
    conn.close()
    print("¡Reparación completada con éxito!")
except Exception as e:
    print("Error en reparación:", e)
