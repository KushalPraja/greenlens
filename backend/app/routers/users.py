from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.user import UserCreate, UserResponse
from app.utils.auth import get_current_user, get_password_hash
from app.utils.db import get_database
from typing import List
from bson import ObjectId

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user = Depends(get_current_user)
):
    return current_user

@router.get("/", response_model=List[UserResponse])
async def list_users(
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    cursor = db.users.find({}, {"hashed_password": 0})
    users = await cursor.to_list(length=None)
    return [UserResponse(**user) for user in users]

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    user = await db.users.find_one(
        {"_id": ObjectId(user_id)},
        {"hashed_password": 0}
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return UserResponse(**user)