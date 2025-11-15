from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path

class Settings(BaseSettings):
    # API Settings
    app_name: str = "Smart Home Management API"
    app_version: str = "1.0.0"
    api_prefix: str = "/api/v1"
    
    # Server Settings
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True
    
    # Security Settings
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # AWS Settings
    AWS_REGION: str = "us-east-2"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    
    # AWS IoT Settings
    AWS_IOT_ENDPOINT: Optional[str] = None  # e.g., xxxxx.iot.us-east-2.amazonaws.com
    AWS_IOT_CERT_PATH: str = "certs/backend/592b3c45701c117be8f3f8c87b8e631c78c4ad6d86d220b9138255e1ef048441-certificate.pem.crt"
    AWS_IOT_KEY_PATH: str = "certs/backend/592b3c45701c117be8f3f8c87b8e631c78c4ad6d86d220b9138255e1ef048441-private.pem.key"
    AWS_IOT_ROOT_CA_PATH: str = "certs/backend/AmazonRootCA1.pem"
    AWS_IOT_CLIENT_ID: str = "smart_home_backend"
    
    # DynamoDB Settings
    dynamodb_endpoint_url: Optional[str] = None  # For local development: http://localhost:8000
    
    # CORS Settings
    cors_origins: str = "*"  # Change to string, will split in main.py
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    @property
    def cors_origins_list(self) -> list:
        """Convert CORS origins string to list"""
        if self.cors_origins == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",")]

settings = Settings()
