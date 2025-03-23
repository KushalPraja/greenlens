from datetime import datetime, timedelta
from typing import Optional, Annotated
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from fastapi.security.oauth2 import OAuth2
from fastapi.openapi.models import OAuthFlows as OAuthFlowsModel
from fastapi.security.utils import get_authorization_scheme_param
from app.models.user import TokenData, UserInDB
from app.utils.db import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Custom OAuth2 scheme for optional authentication
class OAuth2PasswordBearerOptional(OAuth2):
    def __init__(self, tokenUrl: str, auto_error: bool = False):
        flows = OAuthFlowsModel(password={"tokenUrl": tokenUrl, "scopes": {}})
        super().__init__(flows=flows, auto_error=auto_error)

    async def __call__(self, request: Request) -> Optional[str]:
        authorization: str = request.headers.get("Authorization")
        scheme, param = get_authorization_scheme_param(authorization)
        if not authorization or scheme.lower() != "bearer":
            return None
        return param

oauth2_scheme_optional = OAuth2PasswordBearerOptional(tokenUrl="/api/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=30))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, 
        os.getenv("JWT_SECRET", "hello"), 
        algorithm="HS256"
    )
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> UserInDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, 
            os.getenv("JWT_SECRET", "hello"), 
            algorithms=["HS256"]
        )
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
        
    user_dict = await db.users.find_one({"email": token_data.email})
    if user_dict is None:
        raise credentials_exception
    return UserInDB(**user_dict)

async def get_optional_current_user(
    token: Annotated[str, Depends(oauth2_scheme_optional)],
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Optional[UserInDB]:
    """Get the current user (if token is valid) or return None (if no token or invalid token)"""
    if not token:
        return None
    
    try:
        return await get_current_user(token, db)
    except HTTPException:
        return None