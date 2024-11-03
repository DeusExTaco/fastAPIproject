# main.py

import logging
import asyncio
from typing import Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import inspect
from starlette.middleware.base import BaseHTTPMiddleware

from config import get_settings
from database import init_db, SessionLocal
from middleware.performance import record_performance_metrics
from middleware.enhanced_connection_tracker import connection_tracker
from middleware.connection_middleware import EnhancedConnectionMiddleware
from middleware.db import DatabaseMiddleware
from models.performance import ServerPerformance
from workers.performance_worker import PerformanceMonitor
from routes.auth_routes import router as auth_router
from routes.user_routes import router as user_router
from routes.performance_routes import router as performance_router

# Get settings instance
settings = get_settings()

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format=settings.LOG_FORMAT
)
logger = logging.getLogger(__name__)

# Initialize performance monitor
performance_monitor = PerformanceMonitor(interval=60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager handling startup and shutdown tasks
    Now includes enhanced connection tracking and performance monitoring
    """
    # Start connection tracking cleanup task
    await connection_tracker.start_cleanup_task()

    # Database verification
    try:
        db = SessionLocal()
        inspector = inspect(db.bind)

        if not inspector.has_table(ServerPerformance.__tablename__):
            logger.error(f"Table {ServerPerformance.__tablename__} does not exist!")
            raise RuntimeError(f"Required table {ServerPerformance.__tablename__} is missing")

        logger.info(f"Verified {ServerPerformance.__tablename__} table exists")
        db.close()
    except Exception as e:
        logger.error(f"Database verification failed: {str(e)}")
        raise

    # Start performance monitoring
    logger.info("Starting performance monitoring...")
    monitoring_task = asyncio.create_task(performance_monitor.start_monitoring())

    yield

    # Shutdown tasks
    logger.info("Stopping performance monitoring...")
    performance_monitor.stop_monitoring()
    await connection_tracker.stop_cleanup_task()
    try:
        await monitoring_task
    except Exception as e:
        logger.error(f"Error during monitoring shutdown: {str(e)}")


# Create FastAPI app with lifespan
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.API_VERSION,
    lifespan=lifespan
)


# Custom error handling middleware
class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Any) -> Any:
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            logger.error(f"Unhandled error: {str(e)}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "An internal server error occurred",
                    "message": str(e) if settings.DEBUG else None
                }
            )


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.CORS_CREDENTIALS,
    allow_methods=settings.cors_methods_list,
    allow_headers=settings.cors_headers_list,
    expose_headers=[
        "X-Active-Connections",
        "X-Endpoint-Connections",
        "X-Total-Unique-IPs",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
        *settings.cors_headers_list
    ],
    max_age=3600
)

# Add middleware in correct order - order is important!
# 1. Error handling should be first to catch all errors
app.add_middleware(ErrorHandlingMiddleware)

# 2. Database middleware to ensure DB session is available
app.add_middleware(DatabaseMiddleware)

# 3. Enhanced connection tracking with rate limiting
app.add_middleware(
    EnhancedConnectionMiddleware,
    rate_limit=100,  # Requests per window
    rate_window=60,  # Window in seconds
    exclude_paths=["/api/health", "/api/rate-limit-info"]  # Optional: exclude certain paths
)

# 4. Performance metrics recording
app.middleware("http")(record_performance_metrics)

# Initialize the database
init_db()

# Include routers
app.include_router(
    auth_router,
    prefix="/api/auth",
    tags=["Authentication"]
)
app.include_router(
    user_router,
    prefix="/api/users",
    tags=["User Management"]
)
app.include_router(
    performance_router,
    prefix="/api/performance",
    tags=["Performance Monitoring"]
)


@app.get("/api/health")
async def health_check():
    """
    Enhanced health check endpoint that includes connection metrics
    """
    connection_metrics = connection_tracker.get_metrics()

    return {
        "status": "healthy",
        "version": settings.API_VERSION,
        "debug_mode": settings.DEBUG,
        "environment": settings.ENVIRONMENT,
        "connections": {
            "active": connection_metrics["total_active_connections"],
            "authenticated": connection_metrics["authenticated_connections"],
            "anonymous": connection_metrics["anonymous_connections"],
            "unique_ips": connection_metrics["unique_ips"]
        }
    }


# Rate limiting info endpoint
@app.get("/api/rate-limit-info")
async def rate_limit_info(request: Request):
    """
    Endpoint to check current rate limit status for the requesting IP
    """
    client_ip = request.client.host
    metrics = connection_tracker.get_metrics()

    return {
        "ip_address": client_ip,
        "endpoints_accessed": metrics["endpoints_per_ip"].get(client_ip, 0),
        "active_connections": metrics["per_endpoint_connections"]
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )