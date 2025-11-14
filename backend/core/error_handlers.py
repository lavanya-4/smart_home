from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

async def bad_request_handler(request: Request, exc: Exception):
    """Handle 400 Bad Request errors"""
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": "Bad Request",
            "message": "The request contains invalid parameters",
            "status_code": 400
        }
    )

async def unauthorized_handler(request: Request, exc: Exception):
    """Handle 401 Unauthorized errors"""
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={
            "error": "Unauthorized",
            "message": "Authentication credentials are missing or invalid",
            "status_code": 401
        }
    )

async def forbidden_handler(request: Request, exc: Exception):
    """Handle 403 Forbidden errors"""
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={
            "error": "Forbidden",
            "message": "You don't have permission to access this resource",
            "status_code": 403
        }
    )

async def not_found_handler(request: Request, exc: Exception):
    """Handle 404 Not Found errors"""
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "error": "Not Found",
            "message": "The requested resource does not exist",
            "status_code": 404
        }
    )

async def too_many_requests_handler(request: Request, exc: Exception):
    """Handle 429 Too Many Requests errors"""
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "error": "Too Many Requests",
            "message": "Rate limit exceeded, please try again later",
            "status_code": 429
        }
    )

async def internal_server_error_handler(request: Request, exc: Exception):
    """Handle 500 Internal Server Error"""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
            "status_code": 500
        }
    )

async def service_unavailable_handler(request: Request, exc: Exception):
    """Handle 503 Service Unavailable errors"""
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "error": "Service Unavailable",
            "message": "The service is temporarily unavailable",
            "status_code": 503
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "Request validation failed",
            "details": exc.errors(),
            "status_code": 422
        }
    )

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP Exception",
            "message": exc.detail,
            "status_code": exc.status_code
        }
    )
