"""
run_dev.py — Local development server runner with WindowsSelectorEventLoopPolicy
Ensures psycopg3 async works properly on Windows.
"""
import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import uvicorn

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    config = uvicorn.Config("app.main:app", host="127.0.0.1", port=8000, loop="none")
    server = uvicorn.Server(config)
    loop.run_until_complete(server.serve())
