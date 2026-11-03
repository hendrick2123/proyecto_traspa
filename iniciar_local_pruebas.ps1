# ========================================================
# INICIANDO ENTORNO LOCAL DE PRUEBAS (SANDBOX SEGURO)
# Grupo Urbania - Sistema de Traspasos
# ========================================================

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  INICIANDO ENTORNO LOCAL DE PRUEBAS (SANDBOX SEGURO)" -ForegroundColor Green
Write-Host "  Grupo Urbania - Sistema de Traspasos" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan

$env:TABLE_PREFIX = "dev_"

Write-Host "`n[✓] Modo Sandbox activado:" -ForegroundColor Yellow
Write-Host "    - Tabla solicitudes: testing.dev_solicitudes_traspasos_v2" -ForegroundColor Gray
Write-Host "    - Tabla detalles:    testing.dev_detalle_traspaso_insumos_v2" -ForegroundColor Gray
Write-Host "    - Base de producción: 100% PROTEGIDA y aislada`n" -ForegroundColor Green

Start-Process "http://localhost:8000"
python -m uvicorn server_fastapi:app --host 127.0.0.1 --port 8000 --reload

