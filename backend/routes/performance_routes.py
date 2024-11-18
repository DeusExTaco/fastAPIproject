# routes/performance_routes.py
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from auth import get_current_user, check_admin
from db.session import get_db
from models.user import User
from schemas.performance import PerformanceResponse
from services.performance_service import PerformanceService

router = APIRouter(tags=["Performance Monitoring"])


@router.get("/metrics", response_model=PerformanceResponse)
async def get_performance_metrics(
        start_time: Optional[datetime] = Query(None),
        end_time: Optional[datetime] = Query(None),
        limit: int = Query(1000, le=5000),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Get server performance metrics with optional time range filtering.
    Only accessible by admin users.
    """
    # Check admin access
    check_admin(current_user)

    performance_service = PerformanceService(db)

    # Get metrics and summary
    metrics = performance_service.get_performance_metrics(start_time, end_time, limit)
    summary = performance_service.get_performance_summary()

    return {
        "metrics": metrics,
        "summary": summary
    }