@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo [1/5] Reading app version from package.json...
for /f %%v in ('powershell -NoProfile -Command "(Get-Content package.json | ConvertFrom-Json).version"') do set APP_VERSION=%%v
if "%APP_VERSION%"=="" (
  echo Failed to read version from package.json
  exit /b 1
)

set "RELEASE_DIR=release\%APP_VERSION%"
set "INSTALL_DIR=install"
set "SETUP_EXE=RetroAmp-Windows-%APP_VERSION%-x64.exe"
set "PORTABLE_EXE=RetroAmp-Portable-%APP_VERSION%-x64.exe"

echo [2/5] TypeScript build...
call npx tsc
if errorlevel 1 exit /b 1

echo [3/5] Vite build...
call npx vite build
if errorlevel 1 exit /b 1

echo [4/5] Packaging NSIS + Portable...
call npx electron-builder --win nsis portable --x64
if errorlevel 1 exit /b 1

echo [5/5] Copying artifacts to .\install ...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

if exist "%RELEASE_DIR%\%SETUP_EXE%" (
  copy /y "%RELEASE_DIR%\%SETUP_EXE%" "%INSTALL_DIR%\%SETUP_EXE%" >nul
) else (
  echo Missing file: %RELEASE_DIR%\%SETUP_EXE%
  exit /b 1
)

if exist "%RELEASE_DIR%\%PORTABLE_EXE%" (
  copy /y "%RELEASE_DIR%\%PORTABLE_EXE%" "%INSTALL_DIR%\%PORTABLE_EXE%" >nul
) else (
  echo Missing file: %RELEASE_DIR%\%PORTABLE_EXE%
  exit /b 1
)

echo.
echo Build complete.
echo Setup   : %cd%\%INSTALL_DIR%\%SETUP_EXE%
echo Portable: %cd%\%INSTALL_DIR%\%PORTABLE_EXE%

endlocal
