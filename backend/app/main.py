from fastapi import FastAPI

from app.api.router import router
from app.core.config import get_settings
from app.core.logger import setup_logger

settings = get_settings()

logger = setup_logger()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION
)

app.include_router(
    router,
    prefix=settings.API_PREFIX
)


@app.get("/")
async def root():
    return {
        "message": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


@app.on_event("startup")
async def startup_event():
    logger.info("Application Started")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application Shutdown")