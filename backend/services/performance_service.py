# services/performance_service.py
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional, Tuple

from sqlalchemy import func, distinct, case, select
from sqlalchemy.orm import Session
from sqlalchemy.sql import Select

from models.performance import ServerPerformance


@dataclass
class MetricAggregation:
    """Container for aggregated metrics to improve code readability"""
    avg_cpu: float = 0.0
    avg_memory: float = 0.0
    avg_disk: float = 0.0
    avg_response_time: float = 0.0
    total_requests: int = 0
    error_count: int = 0
    avg_connections: float = 0.0
    max_connections: int = 0
    avg_duration: float = 0.0
    total_auth: int = 0
    total_anon: int = 0
    unique_ips: int = 0


class PerformanceService:
    def __init__(self, db: Session):
        self.db = db
        self._time_window = timedelta(hours=24)

    @property
    def time_window_start(self) -> datetime:
        """Get the start time for the current time window"""
        return datetime.now(timezone.utc) - self._time_window

    @staticmethod
    def _build_base_query(start_time: Optional[datetime] = None,
                          end_time: Optional[datetime] = None) -> Select:
        """Build base query with time filters"""
        query = select(ServerPerformance)

        if start_time:
            query = query.filter(ServerPerformance.timestamp >= start_time)
        if end_time:
            query = query.filter(ServerPerformance.timestamp <= end_time)

        return query

    @staticmethod
    def _calculate_error_case() -> case:
        """Define error case statement"""
        return case(
            (ServerPerformance.http_status >= 400, 1),
            else_=0
        )

    def _get_aggregated_metrics(self, since: datetime) -> MetricAggregation:
        """Get aggregated metrics for the time period"""
        error_case = self._calculate_error_case()

        result = self.db.query(
            func.avg(ServerPerformance.cpu_usage).label('avg_cpu'),
            func.avg(ServerPerformance.memory_usage).label('avg_memory'),
            func.avg(ServerPerformance.disk_usage).label('avg_disk'),
            func.avg(ServerPerformance.response_time).label('avg_response_time'),
            func.count(ServerPerformance.id).label('total_requests'),
            func.sum(error_case).label('error_count'),
            func.avg(ServerPerformance.active_connections).label('avg_connections'),
            func.max(ServerPerformance.active_connections).label('max_connections'),
            func.avg(ServerPerformance.avg_connection_duration).label('avg_duration'),
            func.sum(ServerPerformance.authenticated_connections).label('total_auth'),
            func.sum(ServerPerformance.anonymous_connections).label('total_anon'),
            func.max(ServerPerformance.unique_ips).label('unique_ips')
        ).filter(
            ServerPerformance.timestamp >= since
        ).first()

        # Convert all values to Python native types to avoid serialization issues
        return MetricAggregation(
            avg_cpu=float(result.avg_cpu or 0),
            avg_memory=float(result.avg_memory or 0),
            avg_disk=float(result.avg_disk or 0),
            avg_response_time=float(result.avg_response_time or 0),
            total_requests=int(result.total_requests or 0),
            error_count=int(result.error_count or 0),
            avg_connections=float(result.avg_connections or 0),
            max_connections=int(result.max_connections or 0) if result.max_connections else 0,
            avg_duration=float(result.avg_duration or 0),
            total_auth=int(result.total_auth or 0),
            total_anon=int(result.total_anon or 0),
            unique_ips=int(result.unique_ips or 0) if result.unique_ips else 0
        )

    def _get_endpoint_statistics(self, since: datetime) -> Dict[str, Dict[str, float]]:
        """Calculate endpoint-specific statistics"""
        try:
            endpoint_stats = self.db.query(
                ServerPerformance.endpoint,
                func.count(ServerPerformance.id).label('requests'),
                func.avg(ServerPerformance.response_time).label('avg_duration'),
                (100.0 * func.sum(case(
                    (ServerPerformance.authenticated_connections > 0, 1),
                    else_=0
                )) / func.count(ServerPerformance.id)).label('auth_rate')
            ).filter(
                ServerPerformance.timestamp >= since
            ).group_by(
                ServerPerformance.endpoint
            ).all()

            return {
                str(stat.endpoint): {
                    'requests': int(stat.requests or 0),
                    'avg_duration': round(float(stat.avg_duration or 0), 2),
                    'auth_rate': round(float(stat.auth_rate or 0), 2)
                }
                for stat in endpoint_stats
            }
        except Exception as e:
            print(f"Error in _get_endpoint_statistics: {str(e)}")
            return {}

    def _get_ip_statistics(self, since: datetime) -> Dict[str, Dict[str, Any]]:
        """Calculate IP-specific statistics"""
        try:
            ip_stats = self.db.query(
                ServerPerformance.ip_address,
                func.count(ServerPerformance.id).label('requests'),
                func.group_concat(distinct(ServerPerformance.endpoint)).label('endpoints'),
                func.sum(case(
                    (ServerPerformance.ip_stats.is_not(None), 1),
                    else_=0
                )).label('rate_limited')
            ).filter(
                ServerPerformance.timestamp >= since,
                ServerPerformance.ip_address.is_not(None)
            ).group_by(
                ServerPerformance.ip_address
            ).all()

            return {
                str(stat.ip_address): {
                    'requests': int(stat.requests or 0),
                    'endpoints': stat.endpoints.split(',') if stat.endpoints else [],
                    'rate_limited_count': int(stat.rate_limited or 0)
                }
                for stat in ip_stats if stat.ip_address
            }
        except Exception as e:
            print(f"Error in _get_ip_statistics: {str(e)}")
            return {}

    def get_performance_metrics(
            self,
            start_time: Optional[datetime] = None,
            end_time: Optional[datetime] = None,
            limit: int = 1000
    ) -> List[Dict[str, Any]]:
        """Get raw performance metrics with pagination"""
        query = self._build_base_query(start_time, end_time)
        query = query.order_by(ServerPerformance.timestamp.desc()).limit(limit)
        results = self.db.execute(query).scalars().all()

        # Convert SQLAlchemy models to dictionaries with explicit type conversion
        return [{
            "timestamp": metric.timestamp.isoformat(),
            "cpu_usage": float(metric.cpu_usage),
            "memory_usage": float(metric.memory_usage),
            "disk_usage": float(metric.disk_usage),
            "active_connections": int(metric.active_connections),
            "authenticated_connections": int(metric.authenticated_connections),
            "anonymous_connections": int(metric.anonymous_connections),
            "avg_connection_duration": float(metric.avg_connection_duration),
            "response_time": float(metric.response_time),
            "endpoint": str(metric.endpoint),
            "http_status": int(metric.http_status),
            "unique_ips": int(metric.unique_ips)
        } for metric in results]

    @staticmethod
    def _calculate_rates(total_auth: int, total_anon: int) -> Tuple[float, float]:
        """Calculate authentication and anonymous rates"""
        total = total_auth + total_anon
        if total == 0:
            return 0.0, 0.0

        auth_rate = (total_auth / total) * 100
        anon_rate = (total_anon / total) * 100
        return round(auth_rate, 2), round(anon_rate, 2)

    def get_performance_summary(self) -> Dict[str, Any]:
        """Get comprehensive performance summary including all chart data"""
        since = self.time_window_start

        try:
            # Get core metrics
            metrics = self._get_aggregated_metrics(since)

            # Calculate rates
            auth_rate, anon_rate = self._calculate_rates(metrics.total_auth, metrics.total_anon)

            # Calculate error rate
            error_rate = (metrics.error_count / metrics.total_requests * 100) if metrics.total_requests > 0 else 0

            return {
                "last_24h": {
                    # Core metrics
                    "avg_cpu_usage": round(float(metrics.avg_cpu), 2),
                    "avg_memory_usage": round(float(metrics.avg_memory), 2),
                    "avg_disk_usage": round(float(metrics.avg_disk), 2),
                    "avg_response_time": round(float(metrics.avg_response_time), 2),
                    "total_requests": int(metrics.total_requests),
                    "error_rate": round(float(error_rate), 2),

                    # Connection metrics
                    "avg_active_connections": round(float(metrics.avg_connections), 2),
                    "max_active_connections": int(metrics.max_connections),
                    "avg_connection_duration": round(float(metrics.avg_duration), 2),

                    # Authentication metrics
                    "authenticated_connections": int(metrics.total_auth),
                    "anonymous_connections": int(metrics.total_anon),
                    "auth_rate": round(float(auth_rate), 2),
                    "anon_rate": round(float(anon_rate), 2),

                    # Unique visitors
                    "unique_ips": int(metrics.unique_ips),

                    # Detailed statistics
                    "endpoint_stats": self._get_endpoint_statistics(since),
                    "ip_stats": self._get_ip_statistics(since)
                }
            }
        except Exception as e:
            print(f"Error in get_performance_summary: {str(e)}")
            return {"last_24h": {}}

    def record_performance_metric(self, metric_data: Dict[str, Any]) -> ServerPerformance:
        """Record a new performance metric"""
        try:
            metric = ServerPerformance(**metric_data)
            self.db.add(metric)
            self.db.commit()
            self.db.refresh(metric)
            return metric
        except Exception as e:
            self.db.rollback()
            print(f"Error recording performance metric: {str(e)}")
            raise