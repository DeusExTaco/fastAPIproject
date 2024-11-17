# workers/performance_worker.py
import asyncio
import psutil
import time
from datetime import datetime, timezone
import logging
from database import SessionLocal
from models.performance import ServerPerformance
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
from middleware.enhanced_connection_tracker import connection_tracker

logger = logging.getLogger(__name__)


def _get_system_metrics():
    """Collect system metrics with enhanced connection tracking"""
    metrics = {}
    try:
        # Basic metrics
        metrics["timestamp"] = datetime.now(timezone.utc)
        metrics["cpu_usage"] = psutil.cpu_percent(interval=1)
        metrics["memory_usage"] = psutil.virtual_memory().percent
        metrics["disk_usage"] = psutil.disk_usage('/').percent

        # Get enhanced connection metrics
        connection_metrics = connection_tracker.get_metrics()
        metrics["active_connections"] = connection_metrics["total_active_connections"]
        metrics["authenticated_connections"] = connection_metrics["authenticated_connections"]
        metrics["anonymous_connections"] = connection_metrics["anonymous_connections"]
        metrics["unique_ips"] = connection_metrics["unique_ips"]

        # Calculate average connection duration
        durations = connection_metrics["connection_durations"].values()
        metrics["avg_connection_duration"] = (
            sum(durations) / len(durations) if durations else 0.0
        )

        # Store endpoint statistics
        metrics["endpoint_stats"] = {
            "per_endpoint": connection_metrics["per_endpoint_connections"],
            "endpoints_per_ip": connection_metrics["endpoints_per_ip"]
        }

        metrics["endpoint"] = "system_monitor"
        metrics["http_status"] = 200
        metrics["response_time"] = 0  # Base metric

        return metrics

    except Exception as e:
        logger.error(f"Unexpected error in _get_system_metrics: {str(e)}", exc_info=True)
        return None


async def record_request_metrics(request, response_time, status_code):
    """Record metrics for individual requests with enhanced tracking"""
    try:
        # Get enhanced connection metrics for this specific endpoint
        connection_metrics = connection_tracker.get_metrics()

        metrics = {
            "timestamp": datetime.now(timezone.utc),
            "cpu_usage": psutil.cpu_percent(),
            "memory_usage": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage('/').percent,
            "active_connections": connection_metrics["total_active_connections"],
            "authenticated_connections": connection_metrics["authenticated_connections"],
            "anonymous_connections": connection_metrics["anonymous_connections"],
            "response_time": response_time,
            "endpoint": str(request.url.path),
            "http_status": status_code,
            "unique_ips": connection_metrics["unique_ips"],
            "avg_connection_duration": (
                sum(connection_metrics["connection_durations"].values()) /
                len(connection_metrics["connection_durations"])
                if connection_metrics["connection_durations"] else 0.0
            ),
            "endpoint_stats": {
                "per_endpoint": connection_metrics["per_endpoint_connections"],
                "endpoints_per_ip": connection_metrics["endpoints_per_ip"]
            }
        }

        db = SessionLocal()
        try:
            performance_record = ServerPerformance(**metrics)
            db.add(performance_record)
            db.commit()
            logger.debug(f"Recorded request metrics for {request.url.path}")
        except Exception as e:
            db.rollback()
            logger.error(f"Database error recording request metrics: {str(e)}")
            raise
        finally:
            db.close()

    except Exception as e:
        logger.error(f"Critical error recording request metrics: {str(e)}", exc_info=True)


class PerformanceMonitor:
    def __init__(self, interval: int = 60):
        self.interval = interval
        self.is_running = False
        self._last_error_time = 0
        self._error_count = 0
        self._db_error_count = 0
        self._last_db_error_time = 0
        self._monitor_task = None

    async def collect_metrics(self):
        """Collect and store system metrics with enhanced tracking"""
        current_time = time.time()
        if (current_time - self._last_error_time) > 300:
            self._error_count = 0
            self._last_error_time = current_time
            self._db_error_count = 0
            self._last_db_error_time = current_time

        try:
            metrics = _get_system_metrics()
            if not metrics:
                logger.error("Failed to collect system metrics")
                return

            db = SessionLocal()
            try:
                # Test the connection
                db.execute(text("SELECT 1"))

                performance_record = ServerPerformance(**metrics)
                db.add(performance_record)
                db.commit()

            except SQLAlchemyError as e:
                db.rollback()
                if self._db_error_count < 3:
                    logger.error(f"Database error: {str(e)}", exc_info=True)
                self._db_error_count += 1
            finally:
                db.close()

        except Exception as e:
            if self._error_count < 3:
                logger.error(f"Critical error in performance monitoring: {str(e)}", exc_info=True)
            self._error_count += 1

    async def start_monitoring(self):
        """Start the monitoring loop with error recovery"""
        self.is_running = True
        while self.is_running:
            try:
                await self.collect_metrics()
                # Use wait_for to make sleep cancellable
                try:
                    await asyncio.wait_for(asyncio.sleep(self.interval), timeout=self.interval)
                except asyncio.TimeoutError:
                    # This is expected when cancelled
                    if not self.is_running:
                        break
                    pass
            except asyncio.CancelledError:
                logger.info("Performance monitoring task cancelled")
                self.is_running = False
                break
            except Exception as e:
                logger.error(f"Error in monitoring loop: {str(e)}")
                try:
                    await asyncio.wait_for(asyncio.sleep(5), timeout=5)
                except asyncio.TimeoutError:
                    if not self.is_running:
                        break
                    pass

    def stop_monitoring(self):
        """Safely stop the monitoring process"""
        logger.info("Stopping performance monitoring...")
        self.is_running = False