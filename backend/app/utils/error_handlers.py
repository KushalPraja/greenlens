from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from typing import Union

class AppError(HTTPException):
    def __init__(
        self,
        status_code: int,
        detail: Union[str, dict],
        headers: dict = None
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.headers = headers

async def http_error_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail
        }
    )

async def validation_error_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=400,
        content={
            "success": False,
            "error": "Validation error",
            "details": str(exc)
        }
    )