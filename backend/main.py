# FILE: main.py | PURPOSE: FastAPI app entry point with active router loading

import os
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


async def _self_ping():
    import httpx
    base_url = os.environ.get("SELF_URL", "http://localhost:8000")
    await asyncio.sleep(30)
    while True:
        try:
            async with httpx.AsyncClient() as client:
                r = await client.get(f"{base_url}/api/health", timeout=10)
                logger.info(f"Self-ping: {r.status_code}")
        except Exception as e:
            logger.warning(f"Self-ping failed: {e}")
        await asyncio.sleep(14 * 60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(_self_ping())
    logger.info("NURO AI backend started")
    yield
    task.cancel()


app = FastAPI(
    title="NURO AI API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url=None,
)


# 1. Custom Log Middleware (Defined first so it executes after CORS)
@app.middleware("http")
async def log_requests(request: Request, call_next):
    import time
    start = time.time()
    try:
        response = await call_next(request)
        duration_ms = round((time.time() - start) * 1000)
        logger.info(f"{request.method} {request.url.path} → {response.status_code} [{duration_ms}ms]")
        return response
    except Exception as e:
        logger.error(f"Unhandled middleware error: {e}")
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# 2. CORS Middleware (Defined second so it wraps around the log middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Mount WebSocket Live Voice Path Directly (Does not use prefix /api)
try:
    from routers.voice_live import router as voice_live_router
    app.include_router(voice_live_router)
    logger.info("✓ live voice websocket router loaded")
except Exception as e:
    logger.error(f"✗ live voice websocket router failed: {e}")


# ── Import standard API routers one by one so single failures show cleanly in logs
try:
    from routers.health import router as health_router
    app.include_router(health_router, prefix="/api", tags=["Health"])
    logger.info("✓ health router loaded")
except Exception as e:
    logger.error(f"✗ health router failed: {e}")

try:
    from routers.auth import router as auth_router
    app.include_router(auth_router, prefix="/api", tags=["Auth"])
    logger.info("✓ auth router loaded")
except Exception as e:
    logger.error(f"✗ auth router failed: {e}")

try:
    from routers.chat import router as chat_router
    app.include_router(chat_router, prefix="/api", tags=["Chat"])
    logger.info("✓ chat router loaded")
except Exception as e:
    logger.error(f"✗ chat router failed: {e}")

try:
    from routers.therapists import router as therapists_router
    app.include_router(therapists_router, prefix="/api", tags=["Therapists"])
    logger.info("✓ therapists router loaded")
except Exception as e:
    logger.error(f"✗ therapists router failed: {e}")

try:
    from routers.bookings import router as bookings_router
    app.include_router(bookings_router, prefix="/api", tags=["Bookings"])
    logger.info("✓ bookings router loaded")
except Exception as e:
    logger.error(f"✗ bookings router failed: {e}")

try:
    from routers.notes import router as notes_router
    app.include_router(notes_router, prefix="/api", tags=["Notes"])
    logger.info("✓ notes router loaded")
except Exception as e:
    logger.error(f"✗ notes router failed: {e}")

try:
    from routers.admin import router as admin_router
    app.include_router(admin_router, prefix="/api", tags=["Admin"])
    logger.info("✓ admin router loaded")
except Exception as e:
    logger.error(f"✗ admin router failed: {e}")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})










# # FILE: main.py | PURPOSE: FastAPI app entry point

# import os
# import asyncio
# import logging
# from contextlib import asynccontextmanager
# from fastapi import FastAPI, Request
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse
# from dotenv import load_dotenv

# load_dotenv()

# logging.basicConfig(
#     level=logging.INFO,
#     format="%(asctime)s %(levelname)s %(name)s — %(message)s",
# )
# logger = logging.getLogger(__name__)


# async def _self_ping():
#     import httpx
#     base_url = os.environ.get("SELF_URL", "http://localhost:8000")
#     await asyncio.sleep(30)
#     while True:
#         try:
#             async with httpx.AsyncClient() as client:
#                 r = await client.get(f"{base_url}/api/health", timeout=10)
#                 logger.info(f"Self-ping: {r.status_code}")
#         except Exception as e:
#             logger.warning(f"Self-ping failed: {e}")
#         await asyncio.sleep(14 * 60)


# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     task = asyncio.create_task(_self_ping())
#     logger.info("NURO AI backend started")
#     yield
#     task.cancel()


# app = FastAPI(
#     title="NURO AI API",
#     version="1.0.0",
#     lifespan=lifespan,
#     docs_url="/docs",
#     redoc_url=None,
# )

# # ── CORS — allow all origins (auth is via Bearer token, not cookies)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=False,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# @app.middleware("http")
# async def log_requests(request: Request, call_next):
#     import time
#     start = time.time()
#     try:
#         response = await call_next(request)
#         duration_ms = round((time.time() - start) * 1000)
#         logger.info(f"{request.method} {request.url.path} → {response.status_code} [{duration_ms}ms]")
#         return response
#     except Exception as e:
#         logger.error(f"Unhandled middleware error: {e}")
#         return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# # ── Import routers one by one so a single failure shows clearly in logs
# try:
#     from routers.health import router as health_router
#     app.include_router(health_router, prefix="/api", tags=["Health"])
#     logger.info("✓ health router loaded")
# except Exception as e:
#     logger.error(f"✗ health router failed: {e}")

# try:
#     from routers.auth import router as auth_router
#     app.include_router(auth_router, prefix="/api", tags=["Auth"])
#     logger.info("✓ auth router loaded")
# except Exception as e:
#     logger.error(f"✗ auth router failed: {e}")

# try:
#     from routers.chat import router as chat_router
#     app.include_router(chat_router, prefix="/api", tags=["Chat"])
#     logger.info("✓ chat router loaded")
# except Exception as e:
#     logger.error(f"✗ chat router failed: {e}")

# try:
#     from routers.therapists import router as therapists_router
#     app.include_router(therapists_router, prefix="/api", tags=["Therapists"])
#     logger.info("✓ therapists router loaded")
# except Exception as e:
#     logger.error(f"✗ therapists router failed: {e}")

# try:
#     from routers.bookings import router as bookings_router
#     app.include_router(bookings_router, prefix="/api", tags=["Bookings"])
#     logger.info("✓ bookings router loaded")
# except Exception as e:
#     logger.error(f"✗ bookings router failed: {e}")

# try:
#     from routers.notes import router as notes_router
#     app.include_router(notes_router, prefix="/api", tags=["Notes"])
#     logger.info("✓ notes router loaded")
# except Exception as e:
#     logger.error(f"✗ notes router failed: {e}")

# try:
#     from routers.admin import router as admin_router
#     app.include_router(admin_router, prefix="/api", tags=["Admin"])
#     logger.info("✓ admin router loaded")
# except Exception as e:
#     logger.error(f"✗ admin router failed: {e}")


# @app.exception_handler(Exception)
# async def global_exception_handler(request: Request, exc: Exception):
#     logger.error(f"Unhandled exception: {exc}", exc_info=True)
#     return JSONResponse(status_code=500, content={"detail": "Internal server error"})
    


# #chat gpt dndnncnafqefndncndnndjsdankdnvndvndnnnsnandnnzxewhvsdnvnsdklvdnfirhgknjgnvsvhognkfvfn
# # FILE: main.py | PURPOSE: FastAPI app entry point

# import os
# import asyncio
# import logging
# from contextlib import asynccontextmanager
# from fastapi import FastAPI, Request
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse
# from dotenv import load_dotenv

# load_dotenv()

# logging.basicConfig(
#     level=logging.INFO,
#     format="%(asctime)s %(levelname)s %(name)s — %(message)s",
# )
# logger = logging.getLogger(__name__)


# async def _self_ping():
#     import httpx
#     base_url = os.environ.get("SELF_URL", "http://localhost:8000")
#     await asyncio.sleep(30)
#     while True:
#         try:
#             async with httpx.AsyncClient() as client:
#                 r = await client.get(f"{base_url}/api/health", timeout=10)
#                 logger.info(f"Self-ping: {r.status_code}")
#         except Exception as e:
#             logger.warning(f"Self-ping failed: {e}")
#         await asyncio.sleep(14 * 60)


# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     task = asyncio.create_task(_self_ping())
#     logger.info("NURO AI backend started")
#     yield
#     task.cancel()


# app = FastAPI(
#     title="NURO AI API",
#     version="1.0.0",
#     lifespan=lifespan,
#     docs_url="/docs",
#     redoc_url=None,
# )


# # 1. Custom Log Middleware (Defined first so it executes after CORS)
# @app.middleware("http")
# async def log_requests(request: Request, call_next):
#     import time
#     start = time.time()
#     try:
#         response = await call_next(request)
#         duration_ms = round((time.time() - start) * 1000)
#         logger.info(f"{request.method} {request.url.path} → {response.status_code} [{duration_ms}ms]")
#         return response
#     except Exception as e:
#         logger.error(f"Unhandled middleware error: {e}")
#         return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# # 2. CORS Middleware (Defined second so it wraps around the log middleware)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=False,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# # ── Import routers one by one so a single failure shows clearly in logs
# try:
#     from routers.health import router as health_router
#     app.include_router(health_router, prefix="/api", tags=["Health"])
#     logger.info("✓ health router loaded")
# except Exception as e:
#     logger.error(f"✗ health router failed: {e}")

# try:
#     from routers.auth import router as auth_router
#     app.include_router(auth_router, prefix="/api", tags=["Auth"])
#     logger.info("✓ auth router loaded")
# except Exception as e:
#     logger.error(f"✗ auth router failed: {e}")

# try:
#     from routers.chat import router as chat_router
#     app.include_router(chat_router, prefix="/api", tags=["Chat"])
#     logger.info("✓ chat router loaded")
# except Exception as e:
#     logger.error(f"✗ chat router failed: {e}")

# try:
#     from routers.therapists import router as therapists_router
#     app.include_router(therapists_router, prefix="/api", tags=["Therapists"])
#     logger.info("✓ therapists router loaded")
# except Exception as e:
#     logger.error(f"✗ therapists router failed: {e}")

# try:
#     from routers.bookings import router as bookings_router
#     app.include_router(bookings_router, prefix="/api", tags=["Bookings"])
#     logger.info("✓ bookings router loaded")
# except Exception as e:
#     logger.error(f"✗ bookings router failed: {e}")

# try:
#     from routers.notes import router as notes_router
#     app.include_router(notes_router, prefix="/api", tags=["Notes"])
#     logger.info("✓ notes router loaded")
# except Exception as e:
#     logger.error(f"✗ notes router failed: {e}")

# try:
#     from routers.admin import router as admin_router
#     app.include_router(admin_router, prefix="/api", tags=["Admin"])
#     logger.info("✓ admin router loaded")
# except Exception as e:
#     logger.error(f"✗ admin router failed: {e}")


# @app.exception_handler(Exception)
# async def global_exception_handler(request: Request, exc: Exception):
#     logger.error(f"Unhandled exception: {exc}", exc_info=True)
#     return JSONResponse(status_code=500, content={"detail": "Internal server error"})
