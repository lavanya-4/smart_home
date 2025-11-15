from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from datetime import datetime
from contextlib import asynccontextmanager
import logging

from core.config import settings
from core.aws_mqtt_client import initialize_aws_mqtt_client, shutdown_aws_mqtt_client
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
from routes.websocket_routes import router as websocket_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    Handles startup and shutdown events
    """
    # Startup
    logger.info("🚀 Starting Smart Home API...")
    
    # Initialize MQTT client
    try:
        # Check if AWS IoT endpoint is configured
        if hasattr(settings, 'AWS_IOT_ENDPOINT') and settings.AWS_IOT_ENDPOINT:
            # Use AWS IoT Core with AWS IoT SDK
            logger.info(f"Connecting to AWS IoT Core: {settings.AWS_IOT_ENDPOINT}")
            initialize_aws_mqtt_client(
                endpoint=settings.AWS_IOT_ENDPOINT,
                cert_path=settings.AWS_IOT_CERT_PATH,
                key_path=settings.AWS_IOT_KEY_PATH,
                ca_path=settings.AWS_IOT_ROOT_CA_PATH,
                client_id=settings.AWS_IOT_CLIENT_ID
            )
            logger.info("✅ AWS IoT MQTT client connected successfully")
        else:
            logger.warning("No AWS IoT endpoint configured")
            logger.info("ℹ️  App will run without MQTT support (WebSocket still works)")
        
    except FileNotFoundError as e:
        logger.error(f"❌ Certificate file not found: {e}")
        logger.warning("⚠️ MQTT broker not available: Certificate files missing")
        logger.info("ℹ️  App will run without MQTT support (WebSocket still works)")
    except Exception as e:
        logger.warning(f"⚠️ MQTT broker not available: {e}")
        logger.info("ℹ️  App will run without MQTT support (WebSocket still works)")
    
    logger.info("✅ Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("👋 Shutting down Smart Home API...")
    
    try:
        shutdown_aws_mqtt_client()
        logger.info("✅ AWS IoT MQTT client shut down")
    except Exception as e:
        logger.warning(f"⚠️ Error shutting down MQTT client: {e}")
    
    logger.info("✅ Application shutdown complete")


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application
    
    Returns:
        FastAPI: Configured FastAPI application instance
    """
    app = FastAPI(
        title=settings.app_name,
        description="API for managing houses, devices, alerts, and users with MQTT and WebSocket support",
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan
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
    app.include_router(websocket_router)  # WebSocket routes don't need prefix
    
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
