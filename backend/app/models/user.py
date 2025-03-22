from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from bson import ObjectId

class PointHistory(BaseModel):
    amount: int
    action: str
    timestamp: datetime = Field(default_factory=datetime.now)

class Badge(BaseModel):
    name: str
    description: str
    imageUrl: str
    earnedAt: datetime = Field(default_factory=datetime.now)

class UserBase(BaseModel):
    name: str
    email: EmailStr
    avatar: str = "default-avatar.png"
    points: int = 0
    pointsHistory: List[PointHistory] = []
    badges: List[Badge] = []

    class Config:
        populate_by_name = True

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: str = Field(alias="_id")
    hashed_password: str

    @field_validator("id", mode="before")
    @classmethod
    def convert_objectid_to_str(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return v

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "123",
                "name": "John Doe",
                "email": "john@example.com",
                "hashed_password": "hashedpass"
            }
        }

class UserResponse(UserBase):
    id: str = Field(alias="_id")

    @field_validator("id", mode="before")
    @classmethod
    def convert_objectid_to_str(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return v

    class Config:
        populate_by_name = True

class TokenData(BaseModel):
    email: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"