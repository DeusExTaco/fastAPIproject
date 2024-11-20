# backend/middleware/connection_middleware.py
from fastapi import Request, Response, FastAPI
from starlette.middleware.base import BaseHTTPMiddleware
import logging
from typing import List, Optional
from contextlib import asynccontextmanager
from .enhanced_connection_tracker import connection_tracker

logger = logging.getLogger(__name__)


@asynccontextmanager
async def track_connection(request: Request, rate_limit: int, rate_window: int, exclude_paths: List[str]):
    """Enhanced connection tracking context manager"""
    request_id = f"{request.client.host}:{request.client.port}-{id(request)}"

    # Skip rate limiting for excluded paths
    if request.url.path in exclude_paths:
        yield True
        return

    # Get authentication status from request state if available
    user = getattr(request.state, "user", None)
    is_authenticated = user is not None
    user_id = getattr(user, "id", None) if user else None

    try:
        # Check rate limit before adding connection
        rate_limit_ok = await connection_tracker.check_rate_limit(
            source_ip=request.client.host,
            endpoint=request.url.path,
            limit=rate_limit,
            window=rate_window
        )

        if not rate_limit_ok:
            logger.warning(
                f"Rate limit exceeded for {request.client.host} on {request.url.path} "
                f"(limit: {rate_limit} requests per {rate_window} seconds)"
            )
            yield False
            return

        await connection_tracker.add_connection(
            request_id=request_id,
            endpoint=request.url.path,
            source_ip=request.client.host,
            port=request.client.port,
            is_authenticated=is_authenticated,
            user_id=user_id  # Removed rate_window parameter
        )
        yield True
    except Exception as e:
        logger.error(f"Error tracking connection: {str(e)}")
        yield True  # Allow request to proceed even if tracking fails
    finally:
        try:
            duration = await connection_tracker.remove_connection(request_id)
            if duration is not None:
                logger.debug(f"Connection {request_id} duration: {duration:.2f}s")
        except Exception as e:
            logger.error(f"Error removing connection: {str(e)}")


class EnhancedConnectionMiddleware(BaseHTTPMiddleware):
    def __init__(
            self,
            app,
            rate_limit: int = 100,
            rate_window: int = 60,
            exclude_paths: Optional[List[str]] = None
    ):
        super().__init__(app)
        self.rate_limit = rate_limit
        self.rate_window = rate_window
        self.exclude_paths = exclude_paths or []
        logger.info(
            f"Initialized rate limiting: {rate_limit} requests per {rate_window} seconds. "
            f"Excluded paths: {self.exclude_paths}"
        )

    async def dispatch(self, request: Request, call_next):
        async with track_connection(
                request,
                self.rate_limit,
                self.rate_window,
                self.exclude_paths
        ) as allowed:
            if not allowed:
                return Response(
                    content="Rate limit exceeded",
                    status_code=429,
                    headers={
                        "Retry-After": str(self.rate_window),
                        "X-RateLimit-Limit": str(self.rate_limit),
                        "X-RateLimit-Window": str(self.rate_window),
                        "X-RateLimit-Reset": str(self.rate_window)
                    }
                )

            try:
                response = await call_next(request)

                # Add connection tracking headers
                metrics = connection_tracker.get_metrics()
                response.headers.update({
                    "X-Active-Connections": str(metrics["total_active_connections"]),
                    "X-Endpoint-Connections": str(
                        metrics["per_endpoint_connections"].get(request.url.path, 0)
                    ),
                    "X-Total-Unique-IPs": str(metrics["unique_ips"]),
                    "X-RateLimit-Limit": str(self.rate_limit),
                    "X-RateLimit-Window": str(self.rate_window)  # Added rate window to headers
                })

                return response
            except Exception as e:
                logger.error(f"Error in connection middleware: {str(e)}")
                raise


# For backward compatibility
async def connection_tracking_middleware(app: FastAPI, request: Request, call_next):
    """Legacy middleware function for compatibility"""
    middleware = EnhancedConnectionMiddleware(app=app)
    return await middleware.dispatch(request, call_next)
