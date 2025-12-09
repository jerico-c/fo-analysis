"""
Application Configuration
Environment variables and settings management
"""

from typing import List
from pydantic_settings import BaseSettings
from pydantic import validator


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "Fiber Optic Network Analyzer"
    VERSION: str = "0.1.0"
    DEBUG: bool = True
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://localhost:8080"
    
    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/fiber_network_db"
    
    # File Upload
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS: List[str] = [".kml", ".kmz", ".xlsx", ".pdf"]
    
    # Optical Calculations - Default Values
    DEFAULT_FIBER_LOSS: float = 0.35  # dB/km for 1550nm
    DEFAULT_SPLICE_LOSS: float = 0.1  # dB per splice
    DEFAULT_CONNECTOR_LOSS: float = 0.5  # dB per connector
    DEFAULT_SAFETY_MARGIN: float = 3.0  # dB
    DEFAULT_TX_POWER: float = 3.0  # dBm
    DEFAULT_RX_SENSITIVITY: float = -28.0  # dBm
    
    # ML Model Paths
    MODEL_DIR: str = "./ml/models"
    SIGNAL_QUALITY_MODEL: str = "signal_quality_model.pkl"
    ROUTE_OPTIMIZATION_MODEL: str = "route_optimization_model.pkl"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "app.log"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Initialize settings
settings = Settings()
