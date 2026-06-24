from fastapi import APIRouter

from app.api.routes.health import (
    router as health_router
)

from app.api.routes.research import (
    router as research_router
)

router = APIRouter()

router.include_router(
    health_router,
    tags=["Health"]
)

router.include_router(
    research_router,
    tags=["Research"]
)