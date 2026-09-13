# start_dev.ps1 — Local development server launcher
# Uses --loop asyncio to ensure SelectorEventLoop on Windows (required for psycopg3 async)
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --loop asyncio
