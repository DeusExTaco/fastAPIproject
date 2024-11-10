# services/performance_service.py
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from sqlalchemy import func, distinct, case
from sqlalchemy.orm import Session
from models.performance import ServerPerformance

class PerformanceService:
    def __init__(self, db: Session):
        self.db = db

    def get_performance_metrics(
            self,
            start_time: datetime = None,
            end_time: datetime = None,
            limit: int = 1000
    ) -> List[ServerPerformance]:
        query = self.db.query(ServerPerformance)

        if start_time:
            query = query.filter(ServerPerformance.timestamp >= start_time)
        if end_time:
            query = query.filter(ServerPerformance.timestamp <= end_time)

        return query.order_by(ServerPerformance.timestamp.desc()).limit(limit).all()

    def get_performance_summary(self) -> Dict[str, Any]:
        # Get metrics for the last 24 hours
        last_24h = datetime.now(timezone.utc) - timedelta(hours=24)

        # Updated error counting logic with correct case syntax
        error_case = case(
            (ServerPerformance.http_status >= 400, 1),
            else_=0
        )

        # Get total requests and error counts
        metrics = self.db.query(
            func.avg(ServerPerformance.cpu_usage).label('avg_cpu'),
            func.avg(ServerPerformance.memory_usage).label('avg_memory'),
            func.avg(ServerPerformance.disk_usage).label('avg_disk'),
            func.avg(ServerPerformance.response_time).label('avg_response_time'),
            func.count(ServerPerformance.id).label('total_requests'),
            func.sum(error_case).label('error_count'),
            func.avg(ServerPerformance.active_connections).label('avg_connections'),
            func.max(ServerPerformance.active_connections).label('max_connections')
        ).filter(
            ServerPerformance.timestamp >= last_24h
        ).first()

        # Get unique connections
        unique_connections = self.db.query(
            func.count(
                distinct(ServerPerformance.endpoint)
            )
        ).filter(
            ServerPerformance.timestamp >= last_24h
        ).scalar() or 0

        # Safe error rate calculation
        total_requests = metrics.total_requests or 0
        error_count = metrics.error_count or 0
        error_rate = (error_count / total_requests * 100) if total_requests > 0 else 0

        return {
            "last_24h": {
                "avg_cpu_usage": round(metrics.avg_cpu, 2) if metrics.avg_cpu else 0,
                "avg_memory_usage": round(metrics.avg_memory, 2) if metrics.avg_memory else 0,
                "avg_disk_usage": round(metrics.avg_disk, 2) if metrics.avg_disk else 0,
                "avg_response_time": round(metrics.avg_response_time, 2) if metrics.avg_response_time else 0,
                "total_requests": total_requests,
                "error_count": error_count,
                "error_rate": round(error_rate, 2),
                "avg_active_connections": round(metrics.avg_connections, 2) if metrics.avg_connections else 0,
                "max_active_connections": int(metrics.max_connections) if metrics.max_connections else 0,
                "total_unique_connections": unique_connections
            }
        }

    def record_performance_metric(self, metric_data: Dict[str, Any]) -> ServerPerformance:
        metric = ServerPerformance(**metric_data)
        self.db.add(metric)
        self.db.commit()
        self.db.refresh(metric)
        return metric