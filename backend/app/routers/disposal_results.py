from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import Optional
from datetime import datetime
import os
import qrcode
import base64
from io import BytesIO

from app.models.disposal_result import DisposalResultCreate, DisposalResultInDB, DisposalResultResponse
from app.models.user import UserInDB
from app.utils.auth import get_optional_current_user
from app.utils.db import get_database
from app.utils.error_handlers import serialize_mongodb_doc

router = APIRouter()

@router.post("/", response_model=DisposalResultResponse)
async def create_disposal_result(
    disposal_data: dict,
    current_user: Optional[UserInDB] = Depends(get_optional_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new disposal result that can be shared"""
    try:
        # Process the file path - remove the ./ prefix if it exists
        if "imagePath" in disposal_data and disposal_data["imagePath"] and disposal_data["imagePath"].startswith("./"):
            disposal_data["imagePath"] = disposal_data["imagePath"][2:]
        
        # Add the current user ID if logged in
        if current_user:
            disposal_data["userId"] = str(current_user.id)
        
        # Add created timestamp
        disposal_data["createdAt"] = datetime.utcnow()
        
        # Insert into database
        result = await db.disposal_results.insert_one(disposal_data)
        
        # Get the complete document and serialize it
        complete_doc = await db.disposal_results.find_one({"_id": result.inserted_id})
        serialized_doc = serialize_mongodb_doc(complete_doc)
        
        return {
            "success": True,
            "data": serialized_doc
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save disposal result: {str(e)}"
        )

@router.get("/{result_id}", response_model=DisposalResultResponse)
async def get_disposal_result(
    result_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a disposal result by ID"""
    try:
        # Validate ID format
        try:
            object_id = ObjectId(result_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid result ID format")
        
        # Find the disposal result
        result = await db.disposal_results.find_one({"_id": object_id})
        
        if not result:
            raise HTTPException(status_code=404, detail="Disposal result not found")
        
        # Serialize the MongoDB document
        serialized_doc = serialize_mongodb_doc(result)
        
        # Generate QR code for sharing
        qr_url = f"https://green-lens-blond.vercel.app/get-rid/{result_id}"
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = BytesIO()
        img.save(buffered)
        qr_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        # Add QR code to the response
        serialized_doc["qrCode"] = f"data:image/png;base64,{qr_base64}"
        serialized_doc["shareUrl"] = qr_url
        
        return {
            "success": True,
            "data": serialized_doc
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve disposal result: {str(e)}"
        )