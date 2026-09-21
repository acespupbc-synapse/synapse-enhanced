# start_prod.ps1 - Production server launcher for ACES Synapse Enhanced
# Host on 0.0.0.0:8000 so all devices on LAN/Wi-Fi can connect.
# Runs WITHOUT --reload to guarantee rock-solid stability during live student encoding.
# Uses --loop asyncio to ensure SelectorEventLoop on Windows (required for asyncpg / psycopg3).

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ACES Synapse Enhanced - Production Mode" -ForegroundColor Green
Write-Host "  Listening on: http://0.0.0.0:8000" -ForegroundColor Yellow
Write-Host "  (Access from this machine: http://localhost:8000)" -ForegroundColor Gray
Write-Host "  (Access from other devices: http://<your-ip>:8000)" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

.\venv\Scripts\python.exe -m uvicorn app.main:app `
  --host 0.0.0.0 --port 8000 `
  --loop asyncio `
  --timeout-keep-alive 120 `
  --log-level warning
# NOTE: Single worker is intentional.
# In-memory caches (dashboard, presigned URLs, public programs, rate limiter)
# are not Redis-backed. Multiple workers would have divergent cache state.
# To add workers in the future, migrate these caches to Redis first.
