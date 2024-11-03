# schemas/performance.py
from datetime import datetime
from typing import List, Dict
from pydantic import BaseModel, ConfigDict

class PerformanceMetric(BaseModel):
    timestamp: datetime
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    active_connections: int
    response_time: float
    endpoint: str
    http_status: int

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "timestamp": "2024-01-01T00:00:00Z",
                "cpu_usage": 45.5,
                "memory_usage": 62.3,
                "disk_usage": 78.1,
                "active_connections": 25,
                "response_time": 123.45,
                "endpoint": "/api/users",
                "http_status": 200
            }
        }
    )

class PerformanceSummary(BaseModel):
    avg_cpu_usage: float
    avg_memory_usage: float
    avg_disk_usage: float
    avg_response_time: float
    total_requests: int
    error_rate: float
    avg_active_connections: float
    max_active_connections: int
    total_unique_connections: int

class PerformanceResponse(BaseModel):
    metrics: List[PerformanceMetric]
    summary: Dict[str, PerformanceSummary]

    model_config = ConfigDict(
        from_attributes=True
    )