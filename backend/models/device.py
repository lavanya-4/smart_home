from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class DeviceType(str, Enum):
    CAMERA = "camera"
    MICROPHONE = "microphone"

class DeviceAdd(BaseModel):
    house_id: str
    name: str
    device_type: DeviceType
    location: str
    description: Optional[str] = None

class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class DeviceControl(BaseModel):
    action: str
    parameters: Optional[dict] = None

class DeviceResponse(BaseModel):
    device_id: str
    house_id: str
    name: str
    device_type: str
    location: str
    status: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class DeviceStatus(BaseModel):
    device_id: str
    name: str
    status: str
    is_online: bool
    last_activity: datetime
    battery_level: Optional[int] = None
