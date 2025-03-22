from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.utils.auth import get_current_user
from app.models.user import UserInDB
from app.utils.db import get_database
from bson import ObjectId
from typing import List
import asyncio

router = APIRouter()

@router.post("/add")
async def add_points(
    points_data: dict,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    points = points_data.get("points")
    action = points_data.get("action")
    
    if not points or not action:
        raise HTTPException(
            status_code=400,
            detail="Please provide points and action description"
        )
    
    # Update user points
    result = await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {
            "$inc": {"points": points},
            "$push": {
                "pointsHistory": {
                    "amount": points,
                    "action": action,
                }
            }
        }
    )
    
    # Check for badge eligibility
    await check_for_badges(db, current_user.id)
    
    updated_user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    return {
        "success": True,
        "data": {
            "user": updated_user,
            "pointsAdded": points,
            "newTotal": updated_user["points"],
            "action": action
        }
    }

@router.get("/history")
async def get_points_history(
    current_user: UserInDB = Depends(get_current_user)
):
    return {
        "success": True,
        "data": {
            "points": current_user.points,
            "history": current_user.pointsHistory
        }
    }

@router.post("/record-action")
async def record_sustainable_action(
    action_data: dict,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    action = await db.sustainable_actions.find_one(
        {"_id": ObjectId(action_data["actionId"])}
    )
    
    if not action:
        raise HTTPException(
            status_code=404,
            detail="Sustainable action not found"
        )
    
    # Award points for the action
    result = await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {
            "$inc": {"points": action["pointsAwarded"]},
            "$push": {
                "pointsHistory": {
                    "amount": action["pointsAwarded"],
                    "action": f"Completed {action['title']}: {action_data.get('proofDescription', 'No description provided')}"
                }
            }
        }
    )
    
    # Check for badge eligibility
    await check_for_badges(db, current_user.id)
    
    updated_user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    return {
        "success": True,
        "data": {
            "user": updated_user,
            "pointsAdded": action["pointsAwarded"],
            "newTotal": updated_user["points"],
            "action": action["title"]
        }
    }

async def check_for_badges(db: AsyncIOMotorDatabase, user_id: str):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    badge_criteria = [
        {
            "points": 100,
            "name": "Eco Starter",
            "description": "Earned 100 points",
            "imageUrl": "badges/eco-starter.png"
        },
        {
            "points": 500,
            "name": "Green Enthusiast",
            "description": "Earned 500 points",
            "imageUrl": "badges/green-enthusiast.png"
        }
    ]
    
    for badge in badge_criteria:
        if user["points"] >= badge["points"]:
            # Check if user already has this badge
            existing_badge = next(
                (b for b in user.get("badges", []) if b["name"] == badge["name"]),
                None
            )
            
            if not existing_badge:
                await db.users.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$push": {"badges": badge}}
                )