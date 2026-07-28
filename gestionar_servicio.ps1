# ============================================================
# gestionar_servicio.ps1
# Gestiona el servicio TRASPA en Windows
# Uso: .\gestionar_servicio.ps1 [start|stop|restart|status|logs|remove]
# ============================================================

$ServiceName = "traspa_server"
$ProjectDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$NssmExe     = "$ProjectDir\nssm\nssm.exe"
$LogDir      = "$ProjectDir\logs"

$Action = if ($args.Count -gt 0) { $args[0].ToLower() } else { "status" }

function Get-ServiceStatus {
    $svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if (-not $svc) { return $null }
    return $svc.Status
}

switch ($Action) {
    "start" {
        Write-Host "▶️  Iniciando $ServiceName..." -ForegroundColor Green
        & $NssmExe start $ServiceName
        Start-Sleep -Seconds 2
        $st = Get-ServiceStatus
        Write-Host "   Estado: $st"
    }
    "stop" {
        Write-Host "⏹️  Deteniendo $ServiceName..." -ForegroundColor Yellow
        & $NssmExe stop $ServiceName
        Start-Sleep -Seconds 2
        $st = Get-ServiceStatus
        Write-Host "   Estado: $st"
    }
    "restart" {
        Write-Host "🔄 Reiniciando $ServiceName..." -ForegroundColor Cyan
        & $NssmExe restart $ServiceName
        Start-Sleep -Seconds 3
        $st = Get-ServiceStatus
        Write-Host "   Estado: $st"
    }
    "status" {
        $svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
        if (-not $svc) {
            Write-Host "❌ El servicio '$ServiceName' NO está instalado." -ForegroundColor Red
        } else {
            $color = if ($svc.Status -eq "Running") { "Green" } else { "Yellow" }
            Write-Host ""
            Write-Host "📊 Estado del servicio TRASPA" -ForegroundColor Cyan
            Write-Host "   Nombre:  $($svc.Name)"
            Write-Host "   Estado:  $($svc.Status)" -ForegroundColor $color
            Write-Host "   Inicio:  $($svc.StartType)"
            Write-Host "   URL:     http://localhost:8000"
            Write-Host "   Logs:    $LogDir"
            Write-Host ""
        }
    }
    "logs" {
        $logFile = "$LogDir\traspa_stdout.log"
        $errFile = "$LogDir\traspa_stderr.log"
        Write-Host ""
        Write-Host "📄 Últimas 30 líneas de stdout:" -ForegroundColor Cyan
        if (Test-Path $logFile) { Get-Content $logFile -Tail 30 } else { Write-Host "   (sin logs aún)" }
        Write-Host ""
        Write-Host "❗ Últimas 20 líneas de stderr:" -ForegroundColor Yellow
        if (Test-Path $errFile) { Get-Content $errFile -Tail 20 } else { Write-Host "   (sin errores)" }
        Write-Host ""
    }
    "remove" {
        $confirm = Read-Host "⚠️  ¿Seguro que quieres desinstalar el servicio? (s/N)"
        if ($confirm -eq "s" -or $confirm -eq "S") {
            Write-Host "🗑️  Desinstalando $ServiceName..." -ForegroundColor Red
            & $NssmExe stop $ServiceName | Out-Null
            Start-Sleep -Seconds 2
            & $NssmExe remove $ServiceName confirm
            Write-Host "✅ Servicio eliminado."
        } else {
            Write-Host "Cancelado."
        }
    }
    default {
        Write-Host ""
        Write-Host "Uso: .\gestionar_servicio.ps1 [acción]" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Acciones disponibles:"
        Write-Host "  start    → Inicia el servicio"
        Write-Host "  stop     → Detiene el servicio"
        Write-Host "  restart  → Reinicia el servicio"
        Write-Host "  status   → Muestra el estado actual"
        Write-Host "  logs     → Muestra los últimos logs"
        Write-Host "  remove   → Desinstala el servicio de Windows"
        Write-Host ""
    }
}
