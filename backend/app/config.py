from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # MongoDB settings
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "greenlens"
    
    # JWT settings
    SECRET_KEY: str = "your-secret-key-here"
    JWT_SECRET: str = "hello"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Client URL
    CLIENT_URL: str = "http://localhost:3000"
    
    # Environment
    NODE_ENV: str = "development"
    
    # Server settings
    PORT: int = 5000
    
    # Upload settings
    UPLOAD_PATH: str = "./uploads"
    upload_url: str = "http://localhost:5000/uploads"
    
    # API Keys
    GEMINI_API_KEY: str = "AIzaSyClAUPffkOlQ-gkLNmjX2lN9V_VCOx58tc"
    
    class Config:
        env_file = ".env"

settings = Settings()