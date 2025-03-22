from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.sustainable_action import (
    SustainableActionCreate,
    SustainableActionResponse,
    SustainableActionInDB
)
from app.utils.auth import get_current_user
from app.database import get_database
from typing import List
from bson import ObjectId

router = APIRouter()

@router.post("/", response_model=SustainableActionResponse)
async def create_action(
    action: SustainableActionCreate,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    action_dict = action.dict()
    action_dict["createdBy"] = str(current_user.id)
    
    result = await db.sustainable_actions.insert_one(action_dict)
    action_dict["_id"] = result.inserted_id
    
    return SustainableActionInDB(**action_dict)

@router.get("/", response_model=List[SustainableActionResponse])
async def list_actions(
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    cursor = db.sustainable_actions.find()
    actions = await cursor.to_list(length=None)
    return [SustainableActionInDB(**action) for action in actions]

@router.get("/{action_id}", response_model=SustainableActionResponse)
async def get_action(
    action_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    action = await db.sustainable_actions.find_one({"_id": ObjectId(action_id)})
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    return SustainableActionInDB(**action)

@router.put("/{action_id}", response_model=SustainableActionResponse)
async def update_action(
    action_id: str,
    action_update: SustainableActionCreate,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    # Check if action exists and user has permission
    existing_action = await db.sustainable_actions.find_one({"_id": ObjectId(action_id)})
    if not existing_action:
        raise HTTPException(status_code=404, detail="Action not found")
    if str(existing_action["createdBy"]) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to update this action")
    
    # Update action
    update_data = action_update.dict()
    result = await db.sustainable_actions.update_one(
        {"_id": ObjectId(action_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Action not found")
    
    updated_action = await db.sustainable_actions.find_one({"_id": ObjectId(action_id)})
    return SustainableActionInDB(**updated_action)

@router.delete("/{action_id}")
async def delete_action(
    action_id: str,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    # Check if action exists and user has permission
    existing_action = await db.sustainable_actions.find_one({"_id": ObjectId(action_id)})
    if not existing_action:
        raise HTTPException(status_code=404, detail="Action not found")
    if str(existing_action["createdBy"]) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this action")
    
    # Delete action
    result = await db.sustainable_actions.delete_one({"_id": ObjectId(action_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Action not found")
    
    return {"status": "success", "message": "Action deleted successfully"}