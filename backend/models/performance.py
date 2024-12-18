# backend/models/performance.py
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, DateTime, String, JSON
from db.base import Base

class ServerPerformance(Base):
    __tablename__ = 'server_performance'
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    cpu_usage = Column(Float, nullable=False)
    memory_usage = Column(Float, nullable=False)
    disk_usage = Column(Float, nullable=False)
    active_connections = Column(Integer, nullable=False)
    authenticated_connections = Column(Integer, nullable=False, default=0)
    anonymous_connections = Column(Integer, nullable=False, default=0)
    response_time = Column(Float, nullable=False)
    endpoint = Column(String(255), nullable=False)
    http_status = Column(Integer, nullable=False)
    avg_connection_duration = Column(Float, nullable=False, default=0.0)
    unique_ips = Column(Integer, nullable=False, default=0)
    endpoint_stats = Column(JSON, nullable=True)

    def __repr__(self):
        return f"<ServerPerformance(id={self.id}, timestamp={self.timestamp}, endpoint={self.endpoint})>"