from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Generator
from fastapi import Request

async def get_database(request: Request) -> AsyncIOMotorDatabase:
    return request.app.mongodb