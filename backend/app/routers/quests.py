from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
import aiofiles
import json
import random
from pydantic import BaseModel, Field
import google.generativeai as genai
import math

from app.models.quest import QuestCreate, QuestInDB, QuestResponse
from app.models.quest import AssignedQuestCreate, AssignedQuestInDB, AssignedQuestResponse
from app.models.user import UserInDB
from app.utils.auth import get_current_user
from app.utils.db import get_database

router = APIRouter()

# Configure Gemini AI (same configuration as in image_processing)
from app.routers.image_processing import model as gemini_model

# Define common quest categories
QUEST_CATEGORIES = [
    "Waste Reduction", 
    "Energy Conservation", 
    "Water Conservation", 
    "Transportation", 
    "Sustainable Food", 
    "Community Action",
    "Education",
    "Recycling",
    "Reuse",
    "Green Living"
]

# Create wrapper response models to match the API structure
class QuestsResponse(BaseModel):
    success: bool = True
    data: List[QuestResponse]

class AssignedQuestsResponse(BaseModel):
    success: bool = True
    data: List[AssignedQuestResponse]

class QuestCompletionResponse(BaseModel):
    success: bool = True
    data: Dict[str, Any]

class EnvironmentalImpactResponse(BaseModel):
    success: bool = True
    data: Dict[str, Any]

# Helper function to convert MongoDB documents to proper dict with string IDs
def prepare_document(doc):
    """Convert MongoDB document to dict, ensuring ObjectId is converted to string"""
    if doc is None:
        return None
    
    result = dict(doc)
    # Convert _id to string and add as id field
    if "_id" in result:
        result["id"] = str(result["_id"])
        # Remove _id to avoid serialization issues
        del result["_id"]
    
    return result

@router.get("/available", response_model=QuestsResponse)
async def get_available_quests(
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Generate and return available quests for the user"""
    try:
        # First, check how many active quests the user has
        active_quests = await db.assigned_quests.count_documents({
            "userId": str(current_user.id),
            "status": "active"
        })
        
        if active_quests >= 5:
            return QuestsResponse(data=[])  # Return empty list if user has max quests
        
        # Get available quests - use $or to also match null or missing assignedTo field
        cursor = db.quests.find({
            "status": "available",
            "$or": [
                {"assignedTo": None},
                {"assignedTo": {"$exists": False}}
            ]
        })
        available_quests = await cursor.to_list(length=None)
        
        # If we don't have enough available quests, generate new ones
        if len(available_quests) < 5:
            try:
                # Generate new quests using AI
                prompt = f"""Generate {5 - len(available_quests)} unique, diverse, and creative environmental sustainability tasks/quests that someone could realistically complete.
                
                Each task should:
                1. Be specific, actionable, and completable within 1-7 days
                2. Have a clear environmental benefit that can be measured
                3. Be appropriate for the current season and time of year
                4. Require photographic proof to verify completion
                5. Vary in difficulty (include easy, medium, and hard tasks)
                
                Format each task as a JSON object with these fields:
                - title: A catchy, concise title (max 10 words)
                - description: Detailed instructions (2-3 sentences)
                - pointsAwarded: A number between 10-100 based on difficulty (easy: 10-30, medium: 31-60, hard: 61-100)
                - difficulty: "Easy", "Medium", or "Hard"
                - environmentalImpact: A specific environmental benefit
                - category: One of these categories: {", ".join(QUEST_CATEGORIES)}
                - carbonSaved: Approximate CO2 equivalent saved in kg (a realistic number)
                - waterSaved: Approximate water saved in liters (if applicable, otherwise 0)
                - wastePrevented: Approximate waste prevented in kg (if applicable, otherwise 0)
                """
                
                response = gemini_model.generate_content(prompt)
                response_text = response.text.strip()
                
                # Try to extract JSON from response
                start_idx = response_text.find('[')
                end_idx = response_text.rfind(']') + 1
                
                if start_idx != -1 and end_idx > start_idx:
                    json_str = response_text[start_idx:end_idx]
                    new_quests_data = json.loads(json_str)
                    
                    # Insert new quests into database
                    for quest_data in new_quests_data:
                        quest_data["status"] = "available"
                        quest_data["assignedTo"] = None
                        quest_data["createdAt"] = datetime.utcnow()
                        quest = QuestCreate(**quest_data)
                        result = await db.quests.insert_one(quest.dict())
                        
                        # Create quest dict with correct id field
                        db_quest = quest.dict()
                        db_quest["id"] = str(result.inserted_id)
                        available_quests.append(db_quest)
                
            except Exception as e:
                print(f"Error generating quests: {e}")
                # Continue with whatever quests we have
        
        # Properly prepare quest responses
        quest_responses = []
        for quest in available_quests[:5]:
            quest_dict = prepare_document(quest)
            quest_responses.append(QuestResponse(**quest_dict))
        
        return QuestsResponse(data=quest_responses)
    
    except Exception as e:
        print(f"Error in get_available_quests: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get available quests: {str(e)}")

@router.get("/active", response_model=AssignedQuestsResponse)
async def get_active_quests(
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all active quests for the current user"""
    try:
        cursor = db.assigned_quests.find({
            "userId": str(current_user.id),
            "status": "active"
        })
        
        assigned_quests = await cursor.to_list(length=None)
        
        # Fetch quest details for each assigned quest
        result = []
        for aq in assigned_quests:
            assigned_quest = prepare_document(aq)
            
            # Fetch the associated quest details
            try:
                quest = await db.quests.find_one({"_id": ObjectId(assigned_quest["questId"])})
                if quest:
                    quest_dict = prepare_document(quest)
                    assigned_quest["questDetails"] = quest_dict
            except Exception as e:
                print(f"Error fetching quest details: {e}")
                # Continue even if we can't get quest details
                
            result.append(AssignedQuestResponse(**assigned_quest))
        
        return AssignedQuestsResponse(data=result)
    
    except Exception as e:
        print(f"Error in get_active_quests: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get active quests: {str(e)}")

@router.get("/completed", response_model=AssignedQuestsResponse)
async def get_completed_quests(
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all completed quests for the current user"""
    try:
        cursor = db.assigned_quests.find({
            "userId": str(current_user.id),
            "status": "completed"
        })
        
        assigned_quests = await cursor.to_list(length=None)
        
        # Fetch quest details for each assigned quest
        result = []
        for aq in assigned_quests:
            assigned_quest = prepare_document(aq)
            
            try:
                quest = await db.quests.find_one({"_id": ObjectId(assigned_quest["questId"])})
                if quest:
                    quest_dict = prepare_document(quest)
                    assigned_quest["questDetails"] = quest_dict
            except Exception as e:
                print(f"Error fetching quest details: {e}")
                # Continue even if we can't get quest details
                
            result.append(AssignedQuestResponse(**assigned_quest))
        
        return AssignedQuestsResponse(data=result)
    
    except Exception as e:
        print(f"Error in get_completed_quests: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get completed quests: {str(e)}")

@router.post("/assign/{quest_id}", response_model=QuestCompletionResponse)
async def assign_quest(
    quest_id: str,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Assign a quest to the current user"""
    try:
        # Validate quest_id format
        try:
            object_id = ObjectId(quest_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid quest ID format")
        
        # Check if user already has 5 active quests
        active_quests_count = await db.assigned_quests.count_documents({
            "userId": str(current_user.id),
            "status": "active"
        })
        
        if active_quests_count >= 5:
            raise HTTPException(
                status_code=400,
                detail="You already have 5 active quests. Complete some before taking on more."
            )
        
        # Check if quest exists and is available
        quest = await db.quests.find_one({
            "_id": object_id
        })
        
        if not quest:
            raise HTTPException(
                status_code=404,
                detail="Quest not found"
            )
        
        # Check if quest is already assigned
        if quest.get("status") != "available" or (quest.get("assignedTo") is not None and quest.get("assignedTo") != ""):
            raise HTTPException(
                status_code=400,
                detail="Quest is not available for assignment"
            )
        
        # Create assigned quest
        assigned_quest = AssignedQuestCreate(
            questId=quest_id,
            userId=str(current_user.id),
            status="active",
            assignedAt=datetime.utcnow()
        )
        
        # Insert assigned quest
        result = await db.assigned_quests.insert_one(assigned_quest.dict())
        
        # Update quest status
        await db.quests.update_one(
            {"_id": object_id},
            {
                "$set": {
                    "status": "assigned",
                    "assignedTo": str(current_user.id)
                }
            }
        )
        
        # Prepare response
        assigned_quest_dict = assigned_quest.dict()
        assigned_quest_dict["id"] = str(result.inserted_id)
        
        quest_dict = prepare_document(quest)
        assigned_quest_dict["questDetails"] = quest_dict
        
        response_data = AssignedQuestResponse(**assigned_quest_dict).dict()
        return QuestCompletionResponse(data=response_data)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in assign_quest: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to assign quest: {str(e)}")

@router.post("/complete/{assigned_quest_id}", response_model=QuestCompletionResponse)
async def complete_quest(
    assigned_quest_id: str,
    file: UploadFile = File(...),
    description: str = Form(None),
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Complete a quest by uploading proof"""
    try:
        # Validate assigned_quest_id format
        try:
            object_id = ObjectId(assigned_quest_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid assigned quest ID format")
        
        # Check if quest exists and belongs to user
        assigned_quest = await db.assigned_quests.find_one({
            "_id": object_id,
            "userId": str(current_user.id),
            "status": "active"
        })
        
        if not assigned_quest:
            raise HTTPException(
                status_code=404,
                detail="Active quest not found or does not belong to you"
            )
        
        # Get quest details
        quest_id = assigned_quest.get("questId")
        quest = await db.quests.find_one({"_id": ObjectId(quest_id)})
        if not quest:
            raise HTTPException(
                status_code=404,
                detail="Quest details not found"
            )
        
        # Validate image
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="Not an image! Please upload only images."
            )
        
        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024:  # 5MB
            raise HTTPException(
                status_code=400,
                detail="Image too large. Please upload an image under 5MB."
            )
        
        # Save image
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"quest_{assigned_quest_id}_{timestamp}_{file.filename}"
        upload_path = os.getenv("UPLOAD_PATH", "./uploads")
        os.makedirs(upload_path, exist_ok=True)
        file_path = os.path.join(upload_path, filename)
        
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(contents)
        
        points_awarded = quest.get("pointsAwarded", 50)  # Default to 50 if not specified
        
        # Mark quest as completed immediately
        await db.assigned_quests.update_one(
            {"_id": object_id},
            {
                "$set": {
                    "status": "completed",
                    "completedAt": datetime.utcnow(),
                    "proofImagePath": file_path,
                    "description": description or ""
                }
            }
        )
        
        # Award points to user
        await db.users.update_one(
            {"_id": current_user.id},
            {
                "$inc": {"points": points_awarded},
                "$push": {
                    "pointsHistory": {
                        "amount": points_awarded,
                        "action": f"Completed Quest: {quest['title']}",
                        "timestamp": datetime.utcnow()
                    }
                }
            }
        )
        
        result_data = {
            "message": "Quest completed successfully!",
            "points_awarded": points_awarded
        }
        
        return QuestCompletionResponse(success=True, data=result_data)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in complete_quest: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to complete quest: {str(e)}")

@router.get("/impact", response_model=EnvironmentalImpactResponse)
async def get_environmental_impact(
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Calculate the user's total environmental impact from completed quests"""
    try:
        # Get all completed quests for this user
        cursor = db.assigned_quests.find({
            "userId": str(current_user.id),
            "status": "completed"
        })
        
        assigned_quests = await cursor.to_list(length=None)
        
        # Initialize impact metrics
        total_carbon_saved = 0.0
        total_water_saved = 0.0
        total_waste_prevented = 0.0
        total_quests_completed = len(assigned_quests)
        total_points_earned = 0
        
        # Collect quest IDs
        quest_ids = []
        for aq in assigned_quests:
            try:
                quest_ids.append(ObjectId(aq["questId"]))
            except:
                # Skip invalid IDs
                pass
        
        # Fetch all quest details in one query
        if quest_ids:
            completed_quests_cursor = db.quests.find({"_id": {"$in": quest_ids}})
            completed_quests = await completed_quests_cursor.to_list(length=None)
            
            # Sum up the impact metrics
            for quest in completed_quests:
                total_carbon_saved += float(quest.get("carbonSaved", 0))
                total_water_saved += float(quest.get("waterSaved", 0))
                total_waste_prevented += float(quest.get("wastePrevented", 0))
                total_points_earned += int(quest.get("pointsAwarded", 0))
        
        # Generate impact comparisons to make the numbers meaningful
        impact_comparisons = generate_impact_comparisons(
            total_carbon_saved, 
            total_water_saved,
            total_waste_prevented
        )
        
        impact_data = {
            "total_quests_completed": total_quests_completed,
            "total_points_earned": total_points_earned,
            "total_carbon_saved_kg": round(total_carbon_saved, 2),
            "total_water_saved_liters": round(total_water_saved, 2),
            "total_waste_prevented_kg": round(total_waste_prevented, 2),
            "impact_comparisons": impact_comparisons
        }
        
        return EnvironmentalImpactResponse(data=impact_data)
    
    except Exception as e:
        print(f"Error in get_environmental_impact: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate environmental impact: {str(e)}")

def generate_impact_comparisons(carbon_kg, water_liters, waste_kg):
    """Generate relatable comparisons for environmental impact metrics"""
    comparisons = []
    
    # Carbon comparisons
    if carbon_kg > 0:
        # Driving comparison (1 gallon of gas = ~8.89 kg CO2)
        car_miles = round(carbon_kg / 0.404, 1)  # kg CO2 / 0.404 kg per mile
        if car_miles >= 1:
            comparisons.append(f"Carbon saved equivalent to not driving {car_miles} miles in an average car")
        
        # Tree comparison (1 tree absorbs ~22 kg CO2 per year)
        tree_days = round((carbon_kg / 22) * 365, 1)
        if tree_days >= 1:
            comparisons.append(f"Carbon absorbed equivalent to what a tree absorbs in {tree_days} days")
    
    # Water comparisons
    if water_liters > 0:
        # Shower comparison (average shower uses ~65 liters)
        showers = round(water_liters / 65, 1)
        if showers >= 1:
            comparisons.append(f"Water saved equivalent to {showers} typical showers")
        
        # Drinking water comparison
        drinking_days = round(water_liters / 2, 1)  # Assuming 2 liters per day
        if drinking_days >= 1:
            comparisons.append(f"Water saved could provide drinking water for one person for {drinking_days} days")
    
    # Waste comparisons
    if waste_kg > 0:
        # Landfill comparison
        trash_bags = round(waste_kg / 5, 1)  # Assuming average trash bag is 5kg
        if trash_bags >= 1:
            comparisons.append(f"Waste prevented equivalent to {trash_bags} typical household trash bags")
    
    return comparisons