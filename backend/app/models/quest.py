from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from enum import Enum

class QuestStatus(str, Enum):
    AVAILABLE = "available"
    ASSIGNED = "assigned"
    COMPLETED = "completed"
    VERIFIED = "verified"

class QuestBase(BaseModel):
    title: str
    description: str
    pointsAwarded: int
    difficulty: str
    environmentalImpact: str
    category: str
    carbonSaved: float
    waterSaved: float
    wastePrevented: float

class QuestCreate(QuestBase):
    status: QuestStatus = QuestStatus.AVAILABLE
    assignedTo: Optional[str] = None
    createdAt: datetime = datetime.utcnow()

class QuestInDB(QuestBase):
    id: str
    status: QuestStatus
    assignedTo: Optional[str]
    createdAt: datetime

    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class QuestResponse(QuestInDB):
    pass

class AssignedQuestBase(BaseModel):
    questId: str
    userId: str
    status: str
    assignedAt: datetime
    completedAt: Optional[datetime] = None
    proofImagePath: Optional[str] = None
    description: Optional[str] = None

class AssignedQuestCreate(AssignedQuestBase):
    pass

class AssignedQuestInDB(AssignedQuestBase):
    id: str
    questDetails: Optional[dict] = None

    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class AssignedQuestResponse(AssignedQuestInDB):
    pass