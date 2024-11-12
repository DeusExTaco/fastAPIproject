# backend/middleware/enhanced_connection_tracker.py
from datetime import datetime, timedelta, UTC
from typing import Dict, Set, Optional
import asyncio
import logging
from dataclasses import dataclass
from collections import defaultdict

logger = logging.getLogger(__name__)


@dataclass
class ConnectionInfo:
    request_id: str
    start_time: datetime
    endpoint: str
    source_ip: str
    port: int
    is_authenticated: bool
    user_id: Optional[int] = None


class RateLimitInfo:
    def __init__(self, window_seconds: int = 60):
        self.requests = []
        self.window_seconds = window_seconds

    def add_request(self) -> None:
        current_time = datetime.now(UTC)
        self.clean_old_requests(current_time)
        self.requests.append(current_time)

    def clean_old_requests(self, current_time: datetime) -> None:
        cutoff = current_time - timedelta(seconds=self.window_seconds)
        self.requests = [ts for ts in self.requests if ts > cutoff]

    def get_request_count(self) -> int:
        self.clean_old_requests(datetime.now(UTC))
        return len(self.requests)


class EnhancedConnectionTracker:
    def __init__(self):
        self.active_connections: Dict[str, ConnectionInfo] = {}
        self.endpoint_stats: Dict[str, int] = defaultdict(int)
        self.ip_stats: Dict[str, Set[str]] = defaultdict(set)
        self.rate_limits: Dict[str, RateLimitInfo] = defaultdict(lambda: RateLimitInfo())
        self._lock = asyncio.Lock()
        self._cleanup_task = None

    @property
    def connection_count(self) -> int:
        """Maintain compatibility with existing code"""
        return len(self.active_connections)

    async def add_connection(self, request_id: str, endpoint: str, source_ip: str,
                             port: int, is_authenticated: bool = False,
                             user_id: Optional[int] = None):
        """Enhanced version of add_connection with more metadata"""
        async with self._lock:
            self.active_connections[request_id] = ConnectionInfo(
                request_id=request_id,
                start_time=datetime.now(UTC),
                endpoint=endpoint,
                source_ip=source_ip,
                port=port,
                is_authenticated=is_authenticated,
                user_id=user_id
            )
            self.endpoint_stats[endpoint] += 1
            self.ip_stats[source_ip].add(endpoint)
            logger.debug(f"Added connection {request_id}. Total active: {self.connection_count}")

    async def remove_connection(self, request_id: str) -> Optional[float]:
        """Enhanced version that returns connection duration"""
        async with self._lock:
            if request_id in self.active_connections:
                conn_info = self.active_connections[request_id]
                duration = (datetime.now(UTC) - conn_info.start_time).total_seconds()
                self.endpoint_stats[conn_info.endpoint] -= 1
                del self.active_connections[request_id]
                logger.debug(f"Removed connection {request_id}. Total active: {self.connection_count}")
                return duration
            return None

    async def check_rate_limit(self, source_ip: str, endpoint: str, **kwargs) -> bool:
        """
        Check if request should be rate limited

        Args:
            source_ip: The IP address of the request
            endpoint: The endpoint being accessed
            **kwargs: Additional arguments including:
                - limit: Maximum number of requests allowed in the window (default: 100)
                - window: Time window in seconds for rate limiting (default: 60)
        """
        limit = kwargs.get('limit', 100)
        window = kwargs.get('window', 60)

        async with self._lock:
            key = f"{source_ip}:{endpoint}"
            # Create new RateLimitInfo with specified window if it doesn't exist
            if key not in self.rate_limits:
                self.rate_limits[key] = RateLimitInfo(window_seconds=window)
            elif self.rate_limits[key].window_seconds != window:
                # Update window if it changed
                self.rate_limits[key] = RateLimitInfo(window_seconds=window)

            rate_limit_info = self.rate_limits[key]
            if rate_limit_info.get_request_count() >= limit:
                logger.warning(f"Rate limit exceeded for {source_ip} on {endpoint}")
                return False

            rate_limit_info.add_request()
            return True



    def get_metrics(self) -> Dict:
        """Get comprehensive connection metrics"""
        total_connections = len(self.active_connections)
        authenticated_connections = sum(
            1 for conn in self.active_connections.values()
            if conn.is_authenticated
        )

        current_time = datetime.now(UTC)
        metrics = {
            "total_active_connections": total_connections,
            "authenticated_connections": authenticated_connections,
            "anonymous_connections": total_connections - authenticated_connections,
            "per_endpoint_connections": dict(self.endpoint_stats),
            "unique_ips": len(self.ip_stats),
            "endpoints_per_ip": {
                ip: len(endpoints) for ip, endpoints in self.ip_stats.items()
            },
            "connection_durations": {
                conn_id: (current_time - conn.start_time).total_seconds()
                for conn_id, conn in self.active_connections.items()
            }
        }
        return metrics

    async def cleanup_stale_connections(self):
        """Enhanced cleanup that maintains all tracking information"""
        while True:
            try:
                await asyncio.sleep(60)
                current_time = datetime.now(UTC)
                stale_threshold = current_time - timedelta(minutes=5)

                async with self._lock:
                    stale_connections = [
                        conn_id for conn_id, conn in self.active_connections.items()
                        if conn.start_time < stale_threshold
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


# Create global instance
connection_tracker = EnhancedConnectionTracker()