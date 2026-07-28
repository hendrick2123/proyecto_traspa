# ============================================================
# instalar_servicio.ps1
# Instala TRASPA como servicio de Windows usando NSSM
# Ejecutar como ADMINISTRADOR
# ============================================================

$ServiceName  = "traspa_server"
$DisplayName  = "TRASPA - Sistema de Traspasos"
$Description  = "Servidor FastAPI del sistema TRASPA (puerto 8000)"

# ── Rutas ────────────────────────────────────────────────────
$ProjectDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$PythonExe    = (Get-Command python -ErrorAction SilentlyContinue).Source
$NssmExe      = "$ProjectDir\nssm\nssm.exe"
$LogDir       = "$ProjectDir\logs"
$EnvFile      = "$ProjectDir\.env"

# ── Verificaciones previas ───────────────────────────────────
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")) {
    Write-Error "❌ Este script debe ejecutarse como ADMINISTRADOR."
    exit 1
}

if (-not $PythonExe) {
    Write-Error "❌ No se encontró Python en el PATH. Instala Python primero."
    exit 1
}

if (-not (Test-Path $NssmExe)) {
    Write-Host ""
    Write-Host "⚠️  NSSM no encontrado en: $NssmExe" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "👉 Descarga NSSM desde: https://nssm.cc/download" -ForegroundColor Cyan
    Write-Host "   1. Descarga el ZIP"
    Write-Host "   2. Extrae la carpeta 'nssm-2.24' (o la versión que descargues)"
    Write-Host "   3. Renómbrala a 'nssm'"
    Write-Host "   4. Colócala dentro del proyecto: $ProjectDir\nssm\"
    Write-Host "   5. Vuelve a ejecutar este script"
    Write-Host ""
    exit 1
}

# ── Crear directorio de logs ─────────────────────────────────
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
    Write-Host "📁 Directorio de logs creado: $LogDir"
}

# ── Desinstalar servicio previo si existe ────────────────────
$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "🔄 Deteniendo y desinstalando servicio anterior..."
    & $NssmExe stop $ServiceName | Out-Null
    Start-Sleep -Seconds 2
    & $NssmExe remove $ServiceName confirm | Out-Null
    Start-Sleep -Seconds 1
}

# ── Instalar servicio ────────────────────────────────────────
Write-Host ""
Write-Host "⚙️  Instalando servicio '$ServiceName'..." -ForegroundColor Green

& $NssmExe install $ServiceName $PythonExe "-m uvicorn server_fastapi:app --host 0.0.0.0 --port 8000 --workers 1"

# ── Configurar directorio de trabajo ────────────────────────
& $NssmExe set $ServiceName AppDirectory $ProjectDir

# ── Nombre y descripción mostrados en Servicios de Windows ──
& $NssmExe set $ServiceName DisplayName $DisplayName
& $NssmExe set $ServiceName Description $Description

# ── Logs de stdout y stderr ──────────────────────────────────
& $NssmExe set $ServiceName AppStdout "$LogDir\traspa_stdout.log"
& $NssmExe set $ServiceName AppStderr "$LogDir\traspa_stderr.log"
& $NssmExe set $ServiceName AppRotateFiles 1
& $NssmExe set $ServiceName AppRotateOnline 1
& $NssmExe set $ServiceName AppRotateBytes 5242880   # 5 MB por archivo

# ── Reinicio automático ante fallos ─────────────────────────
& $NssmExe set $ServiceName AppExit Default Restart
& $NssmExe set $ServiceName AppRestartDelay 3000     # espera 3 seg antes de reiniciar

# ── Inicio automático al arrancar Windows ───────────────────
& $NssmExe set $ServiceName Start SERVICE_AUTO_START

# ── Cargar variables de entorno desde .env (si existe) ───────
if (Test-Path $EnvFile) {
    $envContent = Get-Content $EnvFile | Where-Object { $_ -match "^\s*[^#].*=.*" }
    & $NssmExe set $ServiceName AppEnvironmentExtra $envContent
    Write-Host "✅ Variables de entorno cargadas desde .env"
}

# ── Iniciar el servicio ahora ─────────────────────────────────
Write-Host ""
Write-Host "🚀 Iniciando el servicio..." -ForegroundColor Green
& $NssmExe start $ServiceName
Start-Sleep -Seconds 3

$svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($svc -and $svc.Status -eq "Running") {
    Write-Host ""
    Write-Host "✅ ¡Servicio instalado y corriendo!" -ForegroundColor Green
    Write-Host "   Nombre:   $ServiceName"
    Write-Host "   URL:      http://localhost:8000"
    Write-Host "   Logs:     $LogDir"
    Write-Host ""
    Write-Host "📋 Comandos útiles:"
    Write-Host "   Detener:     .\gestionar_servicio.ps1 stop"
    Write-Host "   Iniciar:     .\gestionar_servicio.ps1 start"
    Write-Host "   Reiniciar:   .\gestionar_servicio.ps1 restart"
    Write-Host "   Estado:      .\gestionar_servicio.ps1 status"
    Write-Host "   Desinstalar: .\gestionar_servicio.ps1 remove"
} else {
    Write-Host ""
    Write-Host "⚠️  El servicio se instaló pero puede que no esté corriendo." -ForegroundColor Yellow
    Write-Host "   Revisa los logs en: $LogDir"
    Write-Host "   O ejecuta: .\gestionar_servicio.ps1 status"
}
