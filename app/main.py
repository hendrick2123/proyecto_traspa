from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import CORS_ALLOWED_ORIGINS, BROWSER_RESTRICTION_ENABLED, GEO_RESTRICTION_ENABLED, FRONTEND_DIR
from app.core.security import check_geo_location_async, check_browser
from app.repositories.catalogs_repo import fetch_empresas, fetch_centros_costo, fetch_desarrollos, fetch_insumos

app = FastAPI(title="TRASPA API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def access_restriction_middleware(request: Request, call_next):
    path = request.url.path
    is_api = path.startswith("/api/")

    if BROWSER_RESTRICTION_ENABLED and not is_api and request.method != "OPTIONS":
        is_page = path.endswith(".html") or path == "/" or ("." not in path.split("/")[-1])
        if is_page:
            ua = request.headers.get("User-Agent", "")
            ok, browser_name = check_browser(ua)
            if not ok:
                html = f"""<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Navegador No Permitido</title>
                <style>body{{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f0f23;color:#fff;margin:0}}
                .box{{text-align:center;padding:40px;background:rgba(255,255,255,.05);border-radius:16px;max-width:480px}}</style></head>
                <body><div class="box"><h1>🛡️ Navegador No Permitido</h1>
                <p>Detectado: <strong>{browser_name}</strong></p>
                <p>Solo se permite <strong>Google Chrome</strong> o <strong>Microsoft Edge</strong>.</p></div></body></html>"""
                return HTMLResponse(content=html, status_code=403)

    if GEO_RESTRICTION_ENABLED and request.method != "OPTIONS":
        client_ip = request.headers.get("X-Forwarded-For", request.headers.get("X-Real-IP", request.client.host if request.client else "127.0.0.1"))
        client_ip = client_ip.split(",")[0].strip()
        ok, geo_info = await check_geo_location_async(client_ip)
        if not ok:
            html = f"""<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Acceso Restringido</title>
            <style>body{{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f0f23;color:#fff;margin:0}}
            .box{{text-align:center;padding:40px;background:rgba(255,255,255,.05);border-radius:16px;max-width:480px}}</style></head>
            <body><div class="box"><h1>🛡️ Acceso Restringido</h1>
            <p>Ubicación detectada: <strong>{geo_info}</strong></p>
            <p>Solo disponible desde <strong>Ciudad de México (CDMX)</strong>.</p></div></body></html>"""
            return HTMLResponse(content=html, status_code=403)

    return await call_next(request)

# Servir archivos estáticos del frontend
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
