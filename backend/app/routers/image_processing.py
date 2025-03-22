from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Form
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.utils.auth import get_current_user
from app.models.user import UserInDB
from app.utils.db import get_database
import google.generativeai as genai
import os
import json
from typing import Optional
import aiofiles
from datetime import datetime
from dotenv import load_dotenv

router = APIRouter()

# Load environment variables first
load_dotenv()

# Initialize Gemini AI with API key from .env
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

# Configure Gemini AI
genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-2.0-flash")  # Use gemini-pro-vision for image processing

@router.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    context: str = Form(...),
    current_user: Optional[UserInDB] = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Not an image! Please upload only images."
        )
    
    # Read and validate file size
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(
            status_code=400,
            detail="Image too large. Please upload an image under 5MB."
        )
    
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    upload_path = os.getenv("UPLOAD_PATH", "./uploads")
    os.makedirs(upload_path, exist_ok=True)
    file_path = os.path.join(upload_path, filename)
    
    # Save file
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(contents)
    
    try:
        # Create prompt based on context
        if context == "acquire":
            prompt = """Analyze this image and provide sustainable alternatives in the following JSON format:
            {
                "itemName": "Name of the item in the image",
                "itemDescription": "Brief description of what you see",
                "categories": ["Category1", "Category2"],
                "disposalOptions": [
                    {
                        "method": "Sustainable Alternative 1",
                        "description": "Detailed description",
                        "steps": ["Step 1", "Step 2", "Step 3"],
                        "environmentalImpact": "Environmental benefits"
                    }
                ],
                "additionalResources": "Additional information",
                "resourceLink": "URL for more information"
            }"""
        else:
            prompt = """Analyze this image and provide disposal/recycling options in the following JSON format:
            {
                "itemName": "Name of the item in the image",
                "itemDescription": "Brief description of what you see",
                "categories": ["Category1", "Category2"],
                "disposalOptions": [
                    {
                        "method": "Disposal Method 1",
                        "description": "Detailed description",
                        "steps": ["Step 1", "Step 2", "Step 3"],
                        "environmentalImpact": "Environmental impact explanation"
                    }
                ],
                "additionalResources": "Additional recycling information",
                "resourceLink": "URL for more information"
            }"""
        
        # Process with Gemini - remove the await keyword
        image_data = {"mime_type": file.content_type, "data": contents}
        response = model.generate_content([prompt, image_data])
        
        # Extract JSON from response
        try:
            # Look for JSON in the response
            response_text = response.text
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if (start_idx != -1 and end_idx > start_idx):
                json_str = response_text[start_idx:end_idx]
                result = json.loads(json_str)
            else:
                # Fallback structure if no JSON is found
                result = {
                    "itemName": "Unknown Item",
                    "itemDescription": response_text[:200] + "...",
                    "categories": [],
                    "disposalOptions": [{
                        "method": "General Disposal",
                        "description": response_text,
                        "steps": [],
                        "environmentalImpact": "Please consult local recycling guidelines."
                    }],
                    "additionalResources": "Contact your local recycling center for specific guidelines."
                }
            
            # Award points if user is authenticated
            if current_user:
                points_action = "Searched for eco-friendly alternatives" if context == "acquire" else "Sought recycling/reuse suggestions"
                await db.users.update_one(
                    {"_id": current_user.id},
                    {
                        "$inc": {"points": 5},
                        "$push": {
                            "pointsHistory": {
                                "amount": 5,
                                "action": points_action,
                                "timestamp": datetime.utcnow()
                            }
                        }
                    }
                )
            
            return {
                "success": True,
                "data": result
            }
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Response text: {response_text}")
            return {
                "success": True,
                "data": {
                    "itemName": "Analysis Result",
                    "itemDescription": response_text[:200] + "...",
                    "categories": [],
                    "disposalOptions": [{
                        "method": "General Guidelines",
                        "description": response_text,
                        "steps": [],
                        "environmentalImpact": "Please consult local recycling guidelines."
                    }]
                }
            }
            
    except Exception as e:
        # Clean up uploaded file if analysis fails
        try:
            os.remove(file_path)
        except:
            pass
        raise HTTPException(
            status_code=500,
            detail=f"Image analysis error: {str(e)}"
        )

@router.post("/identify")
async def identify_image(
    file: UploadFile = File(...),
    context: str = Form(...),
    current_user: Optional[UserInDB] = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Not an image! Please upload only images."
        )
    
    # Read and validate file size
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(
            status_code=400,
            detail="Image too large. Please upload an image under 5MB."
        )
    
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    upload_path = os.getenv("UPLOAD_PATH", "./uploads")
    os.makedirs(upload_path, exist_ok=True)
    file_path = os.path.join(upload_path, filename)
    
    # Save file
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(contents)
    
    try:
        # Simple prompt to identify the item
        prompt = "Briefly identify what's in this image. Just provide the name of the item or product category you see. Keep it short and concise."
        
        image_data = {"mime_type": file.content_type, "data": contents}
        response = model.generate_content([prompt, image_data])
        
        # Extract item name from response
        item_name = response.text.strip()
        
        return {
            "success": True,
            "data": {
                "itemName": item_name
            }
        }
            
    except Exception as e:
        # Clean up uploaded file if analysis fails
        try:
            os.remove(file_path)
        except:
            pass
        raise HTTPException(
            status_code=500,
            detail=f"Image identification error: {str(e)}"
        )

@router.post("/find-products")
async def find_local_products(
    search_data: dict,
    current_user: Optional[UserInDB] = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    query = search_data.get("query")
    location = search_data.get("location", "nearby stores")
    category = search_data.get("category", "")
    
    if not query:
        raise HTTPException(
            status_code=400,
            detail="Please provide a search query"
        )
    
    try:
        # Create prompt for product search
        prompt = f"""Find sustainable and eco-friendly {query} available in {location}.
        {f'Focus on the {category} category.' if category else ''}
        Return information about reusable, recyclable, and environmentally friendly options.
        For each product, provide the name, description, where to find it locally, approximate price, and environmental benefits.
        Format the response as JSON with an array of 'products' containing 'name', 'description', 'whereToBuy', 'price', and 'environmentalBenefits' fields."""
        
        # Process with Gemini - remove the await keyword
        response = model.generate_content(prompt)
        response_text = response.text
        
        try:
            # Try to extract JSON from response
            products = {}
            json_match = response_text.find("{")
            if json_match != -1:
                products = json.loads(response_text[json_match:])
            else:
                products = {"rawResponse": response_text}
            
            # Award points if user is authenticated
            if current_user:
                await db.users.update_one(
                    {"_id": current_user.id},
                    {
                        "$inc": {"points": 3},
                        "$push": {
                            "pointsHistory": {
                                "amount": 3,
                                "action": "Searched for local eco-friendly products"
                            }
                        }
                    }
                )
            
            return {
                "success": True,
                "data": {
                    "products": products,
                    "query": query,
                    "location": location or "Not specified"
                }
            }
            
        except json.JSONDecodeError:
            return {
                "success": True,
                "data": {
                    "products": {"rawResponse": response_text},
                    "query": query,
                    "location": location or "Not specified"
                }
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Product search error: {str(e)}"
        )