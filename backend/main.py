from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime
from contextlib import asynccontextmanager
import os

# Import error handlers and MongoDB serialization utilities
from app.utils.error_handlers import (
    http_error_handler,
    validation_error_handler,
    MongoJSONEncoder,
    serialize_mongodb_doc
)
from pydantic import ValidationError

# Load environment variables
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create MongoDB connection
    app.mongodb_client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))
    app.mongodb = app.mongodb_client.greenlens
    yield
    # Shutdown: Close MongoDB connection
    app.mongodb_client.close()

# Custom response class for MongoDB documents
class MongoJSONResponse(JSONResponse):
    def render(self, content) -> bytes:
        if isinstance(content, dict):
            # Apply MongoDB document serialization
            content = serialize_mongodb_doc(content)
        return super().render(content)

app = FastAPI(
    title="GreenLens API",
    lifespan=lifespan,
    default_response_class=MongoJSONResponse  # Use our custom response class by default
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add error handlers
app.add_exception_handler(HTTPException, http_error_handler)
app.add_exception_handler(ValidationError, validation_error_handler)

# Mount static files for uploads
uploads_dir = os.path.join(os.getcwd(), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {
        "status": "success",
        "message": "GreenLens API is running!",
        "environment": os.getenv("NODE_ENV", "development"),
        "timestamp": str(datetime.now())
    }

# Import and include routers
from app.routers import (
    auth,
    users,
    sustainable_actions,
    points,
    leaderboard,
    image_processing,
    quests,
    disposal_results
)

# Include all routers with their prefixes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(sustainable_actions.router, prefix="/api/actions", tags=["Sustainable Actions"])
app.include_router(points.router, prefix="/api/points", tags=["Points"])
app.include_router(leaderboard.router, prefix="/api/leaderboard", tags=["Leaderboard"])
app.include_router(image_processing.router, prefix="/api/image", tags=["Image Processing"])
app.include_router(quests.router, prefix="/api/quests", tags=["Quests"])
app.include_router(disposal_results.router, prefix="/api/disposal-results", tags=["Disposal Results"])

# Apply middleware to all routes
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = datetime.now()
    response = await call_next(request)
    process_time = (datetime.now() - start_time).total_seconds()
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Apply MongoDB serialization middleware
@app.middleware("http")
async def mongodb_serialization_middleware(request: Request, call_next):
    response = await call_next(request)
    
    # Only process JSON responses
    if response.headers.get("content-type") == "application/json":
        try:
            body = response.body
            if body:
                # Convert response body to dict and apply MongoDB serialization
                content = serialize_mongodb_doc(response.body_iterator)
                return MongoJSONResponse(content=content)
        except:
            # If any error occurs during serialization, return original response
            pass
    
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5000)),
        reload=os.getenv("NODE_ENV") == "development"
    )