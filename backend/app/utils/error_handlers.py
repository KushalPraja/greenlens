from fastapi import HTTPException, Query, Path, Body, Depends
from fastapi.responses import JSONResponse
from starlette.requests import Request
from starlette.responses import Response
from pydantic import ValidationError
from typing import Any, Dict, List, Optional, Union
from bson import ObjectId
from datetime import datetime
import traceback
import json

class AppError(HTTPException):
    def __init__(
        self,
        status_code: int,
        detail: Union[str, dict],
        headers: dict = None
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.headers = headers

def http_error_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle HTTP exceptions with a consistent error format"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.status_code,
                "message": exc.detail
            }
        }
    )

def validation_error_handler(request: Request, exc: ValidationError) -> JSONResponse:
    """Handle validation errors with a consistent error format"""
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code": 422,
                "message": "Validation error",
                "details": exc.errors()
            }
        }
    )

class MongoJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle MongoDB ObjectId and datetime objects"""
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def serialize_mongodb_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Serializes a MongoDB document for JSON response, converting ObjectId to string"""
    if doc is None:
        return None
    
    result = dict(doc)
    
    # Handle _id specially
    if "_id" in result:
        result["id"] = str(result["_id"])
        del result["_id"]
    
    # Handle other ObjectId fields and nested documents
    for key, value in list(result.items()):
        if isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, dict):
            result[key] = serialize_mongodb_doc(value)
        elif isinstance(value, list):
            result[key] = [
                serialize_mongodb_doc(item) if isinstance(item, dict) else
                str(item) if isinstance(item, ObjectId) else 
                item
                for item in value
            ]
    
    return result