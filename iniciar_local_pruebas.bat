@echo off
chcp 65001 >nul
echo ========================================================
echo   INICIANDO ENTORNO LOCAL DE PRUEBAS (SANDBOX SEGURO)
echo   Grupo Urbania - Sistema de Traspasos
echo ========================================================
echo.
echo [1/3] Configurando variables de entorno aisladas...
set TABLE_PREFIX=dev_

echo [2/3] Levantando servidor local en http://localhost:8000 ...
echo       * Tablas activas: testing.dev_solicitudes_traspasos_v2
echo       * Tablas activas: testing.dev_detalle_traspaso_insumos_v2
echo       * Produccion: 100%% PROTEGIDA (Sin riesgo)
echo.
echo Presione Ctrl + C para detener el servidor cuando termine sus pruebas.
echo.

start "" "http://localhost:8000"
python -m uvicorn server_fastapi:app --host 127.0.0.1 --port 8000 --reload

