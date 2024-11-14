# middleware/cors.py
from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings

def setup_cors(app: FastAPI) -> None:
    """
    Configure CORS middleware with security best practices and debugging
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

    # Define security headers - ensure Authorization is included
    security_headers = [
        "Authorization",           # Keep Authorization at top for visibility
        "Accept",
        "Accept-Language",
        "Content-Type",
        "Content-Length",
        "Accept-Encoding",
        "X-CSRF-Token",
        "X-Requested-With",
        "Access-Control-Allow-Credentials",  # Add this for credentials support
        "Access-Control-Allow-Origin",       # Add this for CORS support
    ]

    # Add custom headers from settings if they exist
    if settings.cors_headers_list != ["*"]:
        security_headers.extend(
            header for header in settings.cors_headers_list
            if header not in security_headers
        )

    # Debug logging in development
    if settings.is_development():
        print("CORS Configuration:")
        print(f"Allowed Origins: {allowed_origins}")
        print(f"Allowed Headers: {security_headers}")
        print(f"Credentials Enabled: {settings.CORS_CREDENTIALS}")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_origin_regex=None,
        allow_credentials=True,  # Set this to True to allow credentials
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=security_headers,
        expose_headers=[
            "X-Active-Connections",
            "X-Endpoint-Connections",
            "X-Total-Unique-IPs",
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset",
        ],
        max_age=3600,
    )