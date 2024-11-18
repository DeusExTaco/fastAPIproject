# middleware/db_middleware.py
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from db.session import SessionLocal

class DatabaseMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        db = SessionLocal()
        request.app.state.db = db
        try:
            response = await call_next(request)
            return response
        finally:
            db.close()