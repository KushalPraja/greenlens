from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.models.user import UserCreate, UserResponse, Token
from app.utils.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.utils.db import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(
    user: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    # Check if user exists
    if await db.users.find_one({"email": user.email}):
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create user document
    user_dict = user.dict()
    user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
    
    # Insert user and get ID
    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = result.inserted_id
    
    # Award initial points
    await db.users.update_one(
        {"_id": result.inserted_id},
        {
            "$inc": {"points": 10},
            "$push": {
                "pointsHistory": {
                    "amount": 10,
                    "action": "Joined GreenLens community"
                }
            }
        }
    )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    # Find user
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    return current_user

@router.put("/updatedetails", response_model=UserResponse)
async def update_user_details(
    user_update: dict,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    # Update allowed fields
    allowed_updates = {"name", "location"}
    update_data = {k: v for k, v in user_update.items() if k in allowed_updates}
    
    if update_data:
        await db.users.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    return updated_user

@router.put("/updatepassword")
async def update_password(
    password_update: dict,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    if not verify_password(password_update["currentPassword"], current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    hashed_password = get_password_hash(password_update["newPassword"])
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"hashed_password": hashed_password}}
    )
    
    return {"success": True}