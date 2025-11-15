from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    email: str  # email is the username
    password: str
    full_name: str
    role: Optional[str] = "user"
    house_ids: Optional[List[str]] = []

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    house_ids: Optional[List[str]] = None

class UserResponse(BaseModel):
    user_id: str
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    house_ids: Optional[List[str]] = []
    created_at: datetime

class UserAuth(BaseModel):
    username: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    role: str
    email: str
