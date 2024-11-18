from models.performance import ServerPerformance
from datetime import datetime, timezone
from db.session import SessionLocal

db = SessionLocal()
try:
    # Test insertion
    test_record = ServerPerformance(
        timestamp=datetime.now(timezone.utc),
        cpu_usage=0.0,
        memory_usage=0.0,
        disk_usage=0.0,
        active_connections=0,
        response_time=0.0,
        endpoint="test",
        http_status=200
    )
    db.add(test_record)
    db.commit()
    print("Test record inserted successfully")
except Exception as e:
    print(f"Error: {str(e)}")
finally:
    db.close()