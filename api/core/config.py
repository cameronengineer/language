from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List

class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # JWT Settings
    jwt_secret_key: str = Field(..., alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field("HS256", alias="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(60, alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")
    jwt_refresh_token_expire_days: int = Field(30, alias="JWT_REFRESH_TOKEN_EXPIRE_DAYS")
    
    # Social Provider Settings
    google_client_id: str = Field(..., alias="GOOGLE_CLIENT_ID")
    facebook_app_id: str = Field(..., alias="FACEBOOK_APP_ID")
    apple_client_id: str = Field(..., alias="APPLE_CLIENT_ID")
    twitter_client_id: str = Field(..., alias="TWITTER_CLIENT_ID")
    
    # Existing settings
    database_url: str = Field("sqlite:////tmp/language_app.db", alias="DATABASE_URL")
    allowed_origins: List[str] = Field(["*"], alias="ALLOWED_ORIGINS")
    app_env: str = Field("development", alias="APP_ENV")
    debug: bool = Field(False, alias="DEBUG")
    
    # Security settings
    rate_limit_per_minute: int = Field(60, alias="RATE_LIMIT_PER_MINUTE")
    
    # API Settings
    api_title: str = "Language Learning API"
    api_version: str = "1.0.0"
    api_description: str = "API for managing language learning with social authentication"
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }
    
    @property
    def is_production(self) -> bool:
        return self.app_env == "production"
    
    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

# Global settings instance
settings = Settings()