from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

from app.api.router import router
from app.core.config import get_settings
from app.core.logger import setup_logger

settings = get_settings()

logger = setup_logger()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION
)

# Add CORS Middleware to support development servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    router,
    prefix=settings.API_PREFIX
)

# Resolve frontend absolute path relative to this file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
frontend_dir = os.path.join(BASE_DIR, "frontend")

# Mount frontend folder at root
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")


@app.on_event("startup")
async def startup_event():
    logger.info("Application Started")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application Shutdown")