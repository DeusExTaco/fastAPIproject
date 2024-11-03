# middleware/performance.py

import time
import logging
from fastapi import Request
from workers.performance_worker import record_request_metrics

logger = logging.getLogger(__name__)


async def record_performance_metrics(request: Request, call_next):
    """Middleware to record performance metrics for each request"""
    start_time = time.time()

    try:
        response = await call_next(request)

        # Calculate response time
        response_time = (time.time() - start_time) * 1000  # Convert to milliseconds

        # Record metrics asynchronously
        try:
            await record_request_metrics(
                request=request,
                response_time=response_time,
                status_code=response.status_code
            )
        except Exception as e:
            logger.error(f"Failed to record metrics: {str(e)}")

        return response

    except Exception as e:
        logger.error(f"Error in performance middleware: {str(e)}")
        raise  # Re-raise the exception to maintain normal error handling