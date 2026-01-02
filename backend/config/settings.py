"""
Application Settings and Configuration
Loads from environment variables with defaults
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # App Settings
    APP_NAME: str = "SQA Management System"
    DEBUG: bool = False
    SECRET_KEY: str = "your-secret-key-change-in-production"
    
    # JWT Settings
    JWT_SECRET_KEY: str = "your-jwt-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # Azure SQL Database
    AZURE_SQL_SERVER: str = ""
    AZURE_SQL_DATABASE: str = ""
    AZURE_SQL_USERNAME: str = ""
    AZURE_SQL_PASSWORD: str = ""
    AZURE_SQL_DRIVER: str = "ODBC Driver 18 for SQL Server"
    
    # Database URL (constructed from Azure SQL settings)
    @property
    def DATABASE_URL(self) -> str:
        if self.AZURE_SQL_SERVER:
            return (
                f"mssql+pyodbc://{self.AZURE_SQL_USERNAME}:{self.AZURE_SQL_PASSWORD}"
                f"@{self.AZURE_SQL_SERVER}/{self.AZURE_SQL_DATABASE}"
                f"?driver={self.AZURE_SQL_DRIVER.replace(' ', '+')}"
                f"&Encrypt=yes&TrustServerCertificate=no"
            )
        # Fallback to SQLite for local development
        return "sqlite+aiosqlite:///./sqa_dev.db"
    
    # Azure OpenAI Settings
    AZURE_OPENAI_API_KEY: str = ""
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_DEPLOYMENT: str = "gpt-4"
    
    # CORS Settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "allow"


# Create settings instance
settings = Settings()
