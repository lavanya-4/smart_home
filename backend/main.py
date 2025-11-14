from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from datetime import datetime

from core.config import settings
from core.error_handlers import (
    validation_exception_handler,
    http_exception_handler,
    bad_request_handler,
    unauthorized_handler,
    forbidden_handler,
    not_found_handler,
    too_many_requests_handler,
    internal_server_error_handler,
    service_unavailable_handler
)
from routes.house_routes import router as house_router
from routes.device_routes import router as device_router
from routes.alert_routes import router as alert_router
from routes.user_routes import router as user_router, auth_router

def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application
    
    Returns:
        FastAPI: Configured FastAPI application instance
    """
    app = FastAPI(
        title=settings.app_name,
        description="API for managing houses, devices, alerts, and users",
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json"
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Register exception handlers
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(400, bad_request_handler)
    app.add_exception_handler(401, unauthorized_handler)
    app.add_exception_handler(403, forbidden_handler)
    app.add_exception_handler(404, not_found_handler)
    app.add_exception_handler(429, too_many_requests_handler)
    app.add_exception_handler(500, internal_server_error_handler)
    app.add_exception_handler(503, service_unavailable_handler)
    
    # Register routers
    app.include_router(house_router, prefix=settings.api_prefix)
    app.include_router(device_router, prefix=settings.api_prefix)
    app.include_router(alert_router, prefix=settings.api_prefix)
    app.include_router(user_router, prefix=settings.api_prefix)
    app.include_router(auth_router, prefix=settings.api_prefix)
    
    # Root endpoints
    @app.get("/", tags=["Root"])
    async def root():
        """API root endpoint"""
        return {
            "message": settings.app_name,
            "version": settings.app_version,
            "documentation": "/docs"
        }
    
    @app.get("/health", tags=["Root"])
    async def health_check():
        """Health check endpoint"""
        return {
            "status": "healthy",
            "timestamp": datetime.now(),
            "version": settings.app_version
        }
    
    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload
    )
