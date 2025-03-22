from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.utils.db import get_database
from app.models.user import UserResponse
from math import ceil
from datetime import datetime, timedelta, timezone
from typing import Annotated, List, Dict, Any
from pydantic import BaseModel

# Create router without prefix - FastAPI will use the prefix from the mount point
router = APIRouter()

class PaginationInfo(BaseModel):
    total: int
    page: int
    limit: int
    pages: int

class LeaderboardData(BaseModel):
    users: List[Dict[str, Any]]
    pagination: PaginationInfo

class LeaderboardResponse(BaseModel):
    success: bool = True
    data: LeaderboardData

# Fix: Ensure the path includes a trailing slash explicitly to prevent redirects
@router.get("/", response_model=LeaderboardResponse)
async def get_leaderboard(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)],
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    timeframe: str = Query(default="all", regex="^(all|week|month)$")
):
    # Calculate skip for pagination
    skip = (page - 1) * limit
    
    # Define now at the start
    now = datetime.now(timezone.utc)
    
    # Build query based on timeframe
    query = {}
    if timeframe != "all":
        if timeframe == "week":
            query["pointsHistory.timestamp"] = {"$gte": now - timedelta(days=7)}
        elif timeframe == "month":
            query["pointsHistory.timestamp"] = {"$gte": now - timedelta(days=30)}
    
    try:
        # Get top users by points
        pipeline = [
            {"$match": query},
            {"$project": {
                "_id": 1,
                "name": 1,
                "email": 1,
                "points": 1,
                "badges": 1,
                "avatar": 1,
                "pointsHistory": 1,
                "totalPoints": {
                    "$cond": [
                        {"$eq": [timeframe, "all"]},
                        "$points",
                        {
                            "$sum": {
                                "$filter": {
                                    "input": "$pointsHistory",
                                    "as": "history",
                                    "cond": {
                                        "$gte": [
                                            "$$history.timestamp",
                                            now - timedelta(days=7 if timeframe == "week" else 30)
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            }},
            {"$sort": {"totalPoints": -1}},
            {"$skip": skip},
            {"$limit": limit}
        ]
        
        users = await db.users.aggregate(pipeline).to_list(length=limit)
        
        # Convert ObjectIds to strings and build response models
        serialized_users = []
        for user in users:
            if user.get('_id'):
                user['_id'] = str(user['_id'])
            if user.get('pointsHistory'):
                for entry in user['pointsHistory']:
                    if '_id' in entry:
                        entry['_id'] = str(entry['_id'])
            serialized_users.append(user)
        
        # Get total count for pagination
        total = await db.users.count_documents(query)
        
        return LeaderboardResponse(
            data=LeaderboardData(
                users=serialized_users,
                pagination=PaginationInfo(
                    total=total,
                    page=page,
                    limit=limit,
                    pages=ceil(total / limit)
                )
            )
        )
    except Exception as e:
        # Fix: Return a more specific error for debugging the HTTPS issue
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching leaderboard: {str(e)}"
        )

# Add an alternative endpoint without trailing slash to prevent redirects
@router.get("", response_model=LeaderboardResponse)
async def get_leaderboard_no_slash(
    db: AsyncIOMotorDatabase = Depends(get_database),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    timeframe: str = Query(default="all", regex="^(all|week|month)$")
):
    # Call the main implementation to avoid duplication
    return await get_leaderboard(db, page, limit, timeframe)

@router.get("/stats")
async def get_leaderboard_stats(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_database)]
):
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    pipeline = [
        {
            "$facet": {
                "weeklyStats": [
                    {
                        "$unwind": "$pointsHistory"
                    },
                    {
                        "$match": {
                            "pointsHistory.timestamp": {"$gte": week_ago}
                        }
                    },
                    {
                        "$group": {
                            "_id": None,
                            "totalPoints": {"$sum": "$pointsHistory.amount"},
                            "totalActions": {"$sum": 1},
                            "uniqueUsers": {"$addToSet": "$_id"}
                        }
                    }
                ],
                "monthlyStats": [
                    {
                        "$unwind": "$pointsHistory"
                    },
                    {
                        "$match": {
                            "pointsHistory.timestamp": {"$gte": month_ago}
                        }
                    },
                    {
                        "$group": {
                            "_id": None,
                            "totalPoints": {"$sum": "$pointsHistory.amount"},
                            "totalActions": {"$sum": 1},
                            "uniqueUsers": {"$addToSet": "$_id"}
                        }
                    }
                ],
                "allTimeStats": [
                    {
                        "$group": {
                            "_id": None,
                            "totalPoints": {"$sum": "$points"},
                            "totalUsers": {"$sum": 1},
                            "totalBadges": {"$sum": {"$size": {"$ifNull": ["$badges", []]}}}
                        }
                    }
                ]
            }
        }
    ]
    
    stats = await db.users.aggregate(pipeline).to_list(length=1)
    if not stats:
        raise HTTPException(status_code=404, detail="No statistics found")
    
    stats = stats[0]
    
    # Convert ObjectId in uniqueUsers arrays to strings
    if 'weeklyStats' in stats and stats['weeklyStats']:
        stats['weeklyStats'][0]['uniqueUsers'] = [str(uid) for uid in stats['weeklyStats'][0].get('uniqueUsers', [])]
    if 'monthlyStats' in stats and stats['monthlyStats']:
        stats['monthlyStats'][0]['uniqueUsers'] = [str(uid) for uid in stats['monthlyStats'][0].get('uniqueUsers', [])]
    
    return {
        "success": True,
        "data": {
            "weekly": stats.get("weeklyStats", [{}])[0],
            "monthly": stats.get("monthlyStats", [{}])[0],
            "allTime": stats.get("allTimeStats", [{}])[0]
        }
    }