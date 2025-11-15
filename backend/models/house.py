from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# Registration Models
class HouseRegister(BaseModel):
    name: str
    address: str
    owner_id: str
    description: Optional[str] = None

class HouseResponse(BaseModel):
    house_id: str
    name: str
    address: str
    owner_id: str
    description: Optional[str] = None
    status: Optional[str] = "active"
    total_devices: Optional[int] = 0
    active_devices: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

class HouseStatus(BaseModel):
    house_id: str
    name: str
    status: str
    total_devices: int
    active_devices: int

class HouseConfigUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
