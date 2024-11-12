# middleware/cors.py
from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings


def setup_cors(app: FastAPI) -> None:
    """
    Configure CORS middleware with security best practices
    """
    settings = get_settings()

    # Define allowed origins based on environment
    allowed_origins: List[str] = (
        settings.cors_origins_list
        if not settings.is_development()
        else [
            "http://localhost:5173",  # Vite default
            "http://localhost:3000",  # Common React port
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
        ]
    )

    # Define security headers
    security_headers = [
        "Accept",
        "Accept-Language",
        "Content-Type",
        "Content-Length",
        "Accept-Encoding",
        "Authorization",
        "X-CSRF-Token",
        "X-Requested-With",
    ]

    # Define exposed headers
    exposed_headers = [
        "X-Active-Connections",
        "X-Endpoint-Connections",
        "X-Total-Unique-IPs",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
    ]

    # Add custom headers from settings if they exist
    if settings.cors_headers_list != ["*"]:
        security_headers.extend(settings.cors_headers_list)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=settings.CORS_CREDENTIALS,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=security_headers,
        expose_headers=exposed_headers,
        max_age=3600,
        allow_origin_regex=None  # Add specific regex pattern if needed
    )