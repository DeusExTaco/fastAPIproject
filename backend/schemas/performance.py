# schemas/performance.py
from datetime import datetime
from typing import List, Dict, Optional
from pydantic import BaseModel, ConfigDict

class PerformanceMetric(BaseModel):
    timestamp: datetime
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    active_connections: int
    authenticated_connections: int
    anonymous_connections: int
    avg_connection_duration: float
    response_time: float
    endpoint: str
    http_status: int
    ip_address: Optional[str] = None
    unique_ips: int

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "timestamp": "2024-01-01T00:00:00Z",
                "cpu_usage": 45.5,
                "memory_usage": 62.3,
                "disk_usage": 78.1,
                "active_connections": 25,
                "authenticated_connections": 15,
                "anonymous_connections": 10,
                "avg_connection_duration": 157.3,
                "response_time": 123.45,
                "endpoint": "/api/users",
                "http_status": 200,
                "ip_address": "192.168.1.1",
                "unique_ips": 45
            }
        }
    )

class EndpointStat(BaseModel):
    requests: int
    avg_duration: float
    auth_rate: float

class IpStat(BaseModel):
    requests: int
    endpoints: List[str]
    rate_limited_count: int

class PerformanceSummary(BaseModel):
    avg_cpu_usage: float
    avg_memory_usage: float
    avg_disk_usage: float
    avg_response_time: float
    total_requests: int
    error_rate: float
    avg_active_connections: float
    max_active_connections: int
    avg_connection_duration: float
    authenticated_connections: int
    anonymous_connections: int
    auth_rate: float
    anon_rate: float
    unique_ips: int
    endpoint_stats: Dict[str, EndpointStat]
    ip_stats: Dict[str, IpStat]

class PerformanceResponse(BaseModel):
    metrics: List[PerformanceMetric]
    summary: Dict[str, PerformanceSummary]

    model_config = ConfigDict(
        from_attributes=True
    )