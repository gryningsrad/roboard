import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from metrics import record_request

import structlog

log = structlog.get_logger()

class RequestContextLoggingMiddleware(BaseHTTPMiddleware):
    """
    Logs one event per request with:
    - request_id (propagated via X-Request-Id)
    - method, path, route template
    - status_code
    - duration_ms
    """

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        start = time.perf_counter()

        # route template isn't available until after routing, but we can set it later
        try:
            response: Response = await call_next(request)
        except Exception:
            duration_ms = int((time.perf_counter() - start) * 1000)

            log.error(
                "request_failed",
                request_id=request_id,
                method=request.method,
                path=str(request.url.path),
                duration_ms=duration_ms,
                client=str(request.client.host) if request.client else None,
                exc_info=True,
            )
            raise

        duration_ms = int((time.perf_counter() - start) * 1000)

        # Try to get route template (e.g. /api/wishlist/toggle/{part_number})
        route = getattr(request.scope.get("route"), "path", None)

        log.info(
            "request",
            request_id=request_id,
            method=request.method,
            path=str(request.url.path),
            route=route,
            status_code=response.status_code,
            duration_ms=duration_ms,
            client=str(request.client.host) if request.client else None,
        )
        
        record_request(request.method, route, response.status_code, duration_ms)

        response.headers["X-Request-Id"] = request_id
        return response
