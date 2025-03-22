from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from .config import settings

client = AsyncIOMotorClient(settings.MONGODB_URI)
mongodb = client[settings.MONGODB_DB_NAME]

async def get_database() -> AsyncIOMotorDatabase:
    return mongodb
