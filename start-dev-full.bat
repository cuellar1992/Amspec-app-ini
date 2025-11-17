@echo off
SETLOCAL

REM ===========================
REM Configuración de puertos
REM ===========================
SET BACKEND_PORT=5000

echo =====================================
echo Iniciando entorno de desarrollo...
echo =====================================

REM ===========================
REM Verificar si el puerto del backend está ocupado
REM ===========================
for /f "tokens=5" %%A in ('netstat -ano ^| findstr :%BACKEND_PORT% ^| findstr LISTENING') do (
    echo Puerto %BACKEND_PORT% ocupado por PID %%A, deteniendo proceso...
    taskkill /PID %%A /F
)

REM ===========================
REM Esperar unos segundos si había conexiones TIME_WAIT
REM ===========================
echo Esperando 2 segundos para liberar posibles TIME_WAIT...
timeout /t 2 /nobreak >nul

REM ===========================
REM Ejecutar npm run dev:full
REM ===========================
echo Lanzando servidor (frontend + backend)...
start cmd /k "npm run dev:full"

echo =====================================
echo Todo listo. El frontend y backend deberían estar corriendo.
echo =====================================

ENDLOCAL
pause
