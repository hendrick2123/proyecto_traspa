import os
import time
import httpx
from fastapi import Request

GEO_RESTRICTION_ENABLED  = os.environ.get("GEO_RESTRICTION_ENABLED", "true").lower() == "true"
GEO_ALLOWED_CITY         = os.environ.get("GEO_ALLOWED_CITY", "Mexico City")
GEO_ALLOWED_COUNTRY      = os.environ.get("GEO_ALLOWED_COUNTRY", "Mexico")
GEO_CACHE_TTL            = int(os.environ.get("GEO_CACHE_TTL", 300))
GEO_CACHE                = {}
GEO_WHITELISTED_IPS      = {"127.0.0.1", "::1", "localhost"}
BROWSER_RESTRICTION_ENABLED = os.environ.get("BROWSER_RESTRICTION_ENABLED", "true").lower() == "true"

async def check_geo_location_async(ip_address: str):
    """Consulta ip-api.com de forma ASÍNCRONA."""
    if ip_address in GEO_WHITELISTED_IPS:
        return True, "IP local (desarrollo)"
        
    cached = GEO_CACHE.get(ip_address)
    if cached:
        allowed, timestamp = cached
        if time.time() - timestamp < GEO_CACHE_TTL:
            return allowed, "caché"

    try:
        url = f"http://ip-api.com/json/{ip_address}?fields=status,country,city,regionName,query"
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(url, headers={"User-Agent": "TraspaServer/2.0"})
            data = resp.json()

        if data.get("status") != "success":
            print(f"Geo: No se pudo verificar IP {ip_address}: {data}")
            return True, "API no disponible (fail-open)"

        city = data.get("city", "")
        country = data.get("country", "")
        region = data.get("regionName", "")

        cdmx_variants = ["mexico city", "ciudad de méxico", "ciudad de mexico", "cdmx"]
        is_allowed = (
            city.lower() in cdmx_variants or
            region.lower() in ["ciudad de méxico", "ciudad de mexico", "mexico city", "distrito federal"]
        ) and country.lower() == "mexico"

        GEO_CACHE[ip_address] = (is_allowed, time.time())
        location_str = f"{city}, {region}, {country}"
        
        if is_allowed:
            print(f"Geo: Acceso PERMITIDO - IP {ip_address} desde {location_str}")
        else:
            print(f"Geo: Acceso BLOQUEADO - IP {ip_address} desde {location_str} (solo CDMX permitido)")
            
        return is_allowed, location_str
    except Exception as e:
        print(f"Geo: Error asíncrono consultando {ip_address}: {e}")
        return True, f"Error de consulta (fail-open): {e}"

def check_browser(user_agent: str):
    if not user_agent:
        return False, "Sin User-Agent"
    ua = user_agent.lower()
    if "edg/" in ua or "edge/" in ua:
        return True, "Microsoft Edge"
    if "chrome/" in ua and "opr/" not in ua:
        return True, "Google Chrome"
    if "firefox/" in ua:
        return False, "Mozilla Firefox"
    elif "safari/" in ua and "chrome/" not in ua:
        return False, "Safari"
    elif "opr/" in ua or "opera" in ua:
        return False, "Opera"
    else:
        return False, "Navegador desconocido"
