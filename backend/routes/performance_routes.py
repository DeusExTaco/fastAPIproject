# routes/performance_routes.py
import logging
from datetime import datetime
from typing import Optional, Union, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from auth import get_current_user, check_admin
from database import get_db
from models.user import User
from schemas.performance import PerformanceResponse
from services.performance_service import PerformanceService

router = APIRouter(tags=["Performance Monitoring"])
logger = logging.getLogger(__name__)

def serialize_datetime(dt: Union[datetime, str, None]) -> Optional[str]:
    """Convert datetime to ISO format string if it's not already a string"""
    if isinstance(dt, datetime):
        return dt.isoformat()
    elif isinstance(dt, str):
        return dt
    return None

def serialize_metric(metric: Dict[str, Any]) -> Dict[str, Any]:
    """Serialize a single metric with type checking"""
    try:
        return {
            "timestamp": serialize_datetime(metric.get("timestamp")),
            "cpu_usage": float(metric.get("cpu_usage", 0)),
            "memory_usage": float(metric.get("memory_usage", 0)),
            "disk_usage": float(metric.get("disk_usage", 0)),
            "active_connections": int(metric.get("active_connections", 0)),
            "authenticated_connections": int(metric.get("authenticated_connections", 0)),
            "anonymous_connections": int(metric.get("anonymous_connections", 0)),
            "avg_connection_duration": float(metric.get("avg_connection_duration", 0)),
            "response_time": float(metric.get("response_time", 0)),
            "endpoint": str(metric.get("endpoint", "")),
            "http_status": int(metric.get("http_status", 0)),
            "unique_ips": int(metric.get("unique_ips", 0))
        }
    except (ValueError, TypeError) as e:
        logger.error(f"Error serializing metric: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error serializing metric: {str(e)}"
        )

def serialize_endpoint_stats(stats: Dict[str, Any]) -> Dict[str, Any]:
    """Serialize endpoint statistics"""
    try:
        return {
            endpoint: {
                "requests": int(stat.get("requests", 0)),
                "avg_duration": float(stat.get("avg_duration", 0)),
                "auth_rate": float(stat.get("auth_rate", 0))
            }
            for endpoint, stat in stats.items()
        }
    except (ValueError, TypeError) as e:
        logger.error(f"Error serializing endpoint stats: {e}")
        return {}

def serialize_ip_stats(stats: Dict[str, Any]) -> Dict[str, Any]:
    """Serialize IP statistics"""
    try:
        return {
            ip: {
                "requests": int(stat.get("requests", 0)),
                "endpoints": list(stat.get("endpoints", [])),
                "rate_limited_count": int(stat.get("rate_limited_count", 0))
            }
            for ip, stat in stats.items()
        }
    except (ValueError, TypeError) as e:
        logger.error(f"Error serializing IP stats: {e}")
        return {}

@router.get("/metrics", response_model=PerformanceResponse)
async def get_performance_metrics(
        request: Request,
        start_time: Optional[datetime] = Query(None),
        end_time: Optional[datetime] = Query(None),
        limit: int = Query(1000, le=5000),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Get server performance metrics with optional time range filtering."""
    try:
        logger.debug(f"Performance metrics request from {request.client.host}")

        # Check admin access
        check_admin(current_user)

        performance_service = PerformanceService(db)

        # Get metrics and summary
        raw_metrics = performance_service.get_performance_metrics(start_time, end_time, limit)
        raw_summary = performance_service.get_performance_summary()

        # Serialize metrics with error handling
        try:
            metrics = [serialize_metric(metric) for metric in raw_metrics]
        except Exception as e:
            logger.error(f"Error serializing metrics: {e}")
            metrics = []

        # Serialize summary
        summary = {
            "last_24h": {
                "avg_cpu_usage": float(raw_summary["last_24h"].get("avg_cpu_usage", 0)),
                "avg_memory_usage": float(raw_summary["last_24h"].get("avg_memory_usage", 0)),
                "avg_disk_usage": float(raw_summary["last_24h"].get("avg_disk_usage", 0)),
                "avg_response_time": float(raw_summary["last_24h"].get("avg_response_time", 0)),
                "total_requests": int(raw_summary["last_24h"].get("total_requests", 0)),
                "error_rate": float(raw_summary["last_24h"].get("error_rate", 0)),
                "avg_active_connections": float(raw_summary["last_24h"].get("avg_active_connections", 0)),
                "max_active_connections": int(raw_summary["last_24h"].get("max_active_connections", 0)),
                "avg_connection_duration": float(raw_summary["last_24h"].get("avg_connection_duration", 0)),
                "authenticated_connections": int(raw_summary["last_24h"].get("authenticated_connections", 0)),
                "anonymous_connections": int(raw_summary["last_24h"].get("anonymous_connections", 0)),
                "unique_ips": int(raw_summary["last_24h"].get("unique_ips", 0)),
                "endpoint_stats": serialize_endpoint_stats(raw_summary["last_24h"].get("endpoint_stats", {})),
                "ip_stats": serialize_ip_stats(raw_summary["last_24h"].get("ip_stats", {}))
            }
        }

        # Log the response for debugging
        logger.debug(f"Returning {len(metrics)} metrics")

        return JSONResponse(
            content={
                "metrics": metrics,
                "summary": summary
            }
        )

    except Exception as e:
        logger.error(f"Error in get_performance_metrics: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )