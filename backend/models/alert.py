from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class AlertSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

class AlertResponse(BaseModel):
    alert_id: str
    house_id: str
    device_id: Optional[str] = None
    severity: AlertSeverity
    message: str
    timestamp: datetime
    is_read: bool

class AlertConfigUpdate(BaseModel):
    severity_threshold: Optional[str] = None
    notification_enabled: Optional[bool] = None
    notification_channels: Optional[List[str]] = None

class DataStream(BaseModel):
    device_id: str
    metric: str
    value: float
    unit: str
    timestamp: datetime

class AlertStatus(BaseModel):
    total_alerts: int
    unread_alerts: int
    critical_alerts: int
