@echo off
rem Starts the reels server in its own virtual environment, so it does not matter which
rem Python is first on your PATH. Run it from anywhere; it works in this folder.
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
  echo Creating the virtual environment...
  rem Python 3.11 is the version this was tested with. Fall back to whatever "py" or "python" gives.
  py -3.11 -m venv .venv 2>nul || py -3 -m venv .venv 2>nul || python -m venv .venv
)

if not exist ".venv\Scripts\python.exe" (
  echo.
  echo Could not create .venv\Scripts\python.exe.
  echo Install Python 3.11 from python.org ^(tick "Add python.exe to PATH"^), then run this again.
  pause
  exit /b 1
)

echo Checking packages...
".venv\Scripts\python.exe" -m pip install --quiet -r requirements.txt
if errorlevel 1 (
  echo.
  echo Installing the packages failed. Check your internet connection and try again.
  pause
  exit /b 1
)

if not exist ".env" echo Note: no .env file yet. Copy .env.example to .env and fill it in to use a real Instagram account.
echo Starting the reels server on http://127.0.0.1:8765  ^(Ctrl+C to stop^)
".venv\Scripts\python.exe" app.py
