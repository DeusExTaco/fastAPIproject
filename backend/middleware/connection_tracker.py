# middleware/connection_tracker.py
from fastapi import Request
import asyncio
from datetime import datetime, timedelta, timezone
import logging
from typing import Dict, Set
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)


class ConnectionTracker:
    def __init__(self):
        self.active_connections: Set[str] = set()
        self.connection_times: Dict[str, datetime] = {}
        self._lock = asyncio.Lock()
        self._cleanup_task = None

    @property
    def connection_count(self) -> int:
        return len(self.active_connections)

    async def add_connection(self, request_id: str):
        async with self._lock:
            self.active_connections.add(request_id)
            self.connection_times[request_id] = datetime.now(timezone.utc)
            logger.debug(f"Added connection {request_id}. Total active: {self.connection_count}")

    async def remove_connection(self, request_id: str):
        async with self._lock:
            self.active_connections.discard(request_id)
            self.connection_times.pop(request_id, None)
            logger.debug(f"Removed connection {request_id}. Total active: {self.connection_count}")

    async def cleanup_stale_connections(self):
        """Remove connections that haven't been active for more than 5 minutes"""
        while True:
            try:
                await asyncio.sleep(60)  # Run cleanup every minute
                current_time = datetime.now(timezone.utc)
                stale_threshold = current_time - timedelta(minutes=5)

                async with self._lock:
                    stale_connections = [
                        conn_id for conn_id, conn_time in self.connection_times.items()
                        if conn_time < stale_threshold
                    ]

                    for conn_id in stale_connections:
                        await self.remove_connection(conn_id)
                        logger.info(f"Removed stale connection {conn_id}")

            except Exception as e:
                logger.error(f"Error in connection cleanup: {str(e)}")

    async def start_cleanup_task(self):
        """Start the background cleanup task"""
        self._cleanup_task = asyncio.create_task(self.cleanup_stale_connections())

    async def stop_cleanup_task(self):
        """Stop the background cleanup task"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass


# Global connection tracker instance
connection_tracker = ConnectionTracker()


@asynccontextmanager
async def track_connection(request_id: str):
    """Context manager for tracking connections"""
    try:
        await connection_tracker.add_connection(request_id)
        yield
    finally:
        await connection_tracker.remove_connection(request_id)


# Middleware for connection tracking
async def connection_tracking_middleware(request: Request, call_next):
    request_id = f"{request.client.host}:{request.client.port}-{id(request)}"

    async with track_connection(request_id):
        response = await call_next(request)
        return response