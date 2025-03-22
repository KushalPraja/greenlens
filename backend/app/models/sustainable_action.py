from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Resource(BaseModel):
    title: str
    url: str

class SustainableActionBase(BaseModel):
    title: str
    description: str
    category: str
    difficulty: str = Field(default="Medium", pattern="^(Easy|Medium|Hard)$")
    environmentalImpact: str = Field(default="Medium", pattern="^(Low|Medium|High)$")
    pointsAwarded: int
    tips: List[str] = []
    resources: List[Resource] = []

class SustainableActionCreate(SustainableActionBase):
    pass

class SustainableActionInDB(SustainableActionBase):
    id: str = Field(alias="_id")
    createdAt: datetime = Field(default_factory=datetime.now)
    createdBy: Optional[str] = None  # User ID

class SustainableActionResponse(SustainableActionInDB):
    pass