from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId

# Custom type handler for ObjectId
class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        elif isinstance(v, str):
            try:
                ObjectId(v)
                return v
            except:
                raise ValueError("Invalid ObjectId")
        raise ValueError("Invalid ObjectId")

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")
        return field_schema

class DisposalOption(BaseModel):
    method: str
    description: str
    steps: List[str] = []
    environmentalImpact: Optional[str] = None

    model_config = ConfigDict(extra="allow")

class DisposalResultCreate(BaseModel):
    itemName: str
    itemDescription: str
    categories: List[str] = []
    disposalOptions: List[DisposalOption]
    additionalResources: Optional[str] = None
    resourceLink: Optional[str] = None
    imagePath: Optional[str] = None
    userId: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(extra="allow")

class DisposalResultInDB(DisposalResultCreate):
    id: PyObjectId = Field(alias="_id", default_factory=PyObjectId)

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        populate_by_name=True,
        json_encoders={ObjectId: str},
        extra="allow"
    )

class DisposalResultResponse(BaseModel):
    success: bool = True
    data: Dict[str, Any]

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
        extra="allow"
    )