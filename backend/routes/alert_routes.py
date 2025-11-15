from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional, List
from datetime import datetime

from models.alert import (
    AlertResponse,
    AlertConfigUpdate,
    DataStream,
    AlertStatus,
    AlertSeverity
)
from models.common import MessageResponse
from core.dependencies import optional_verify_token
from core.database import get_table, Tables
from botocore.exceptions import ClientError

router = APIRouter(prefix="/alerts", tags=["Alerting"])

@router.get("/history", response_model=List[AlertResponse])
async def get_alert_history(
    house_id: Optional[str] = None,
    device_id: Optional[str] = None,
    severity: Optional[AlertSeverity] = None,
    limit: int = 100,
    token: Optional[str] = Depends(optional_verify_token)
):
    """
    Get alert history with optional filters
    
    Args:
        house_id: Filter by house ID
        device_id: Filter by device ID
        severity: Filter by severity level
        limit: Maximum number of alerts to return
        
    Returns:
        List of alerts
    """
    table = get_table(Tables.ALERTS)
    
    try:
        # Build filter expression
        filter_expressions = []
        expression_attribute_values = {}
        
        if house_id:
            filter_expressions.append("house_id = :house_id")
            expression_attribute_values[':house_id'] = house_id
        
        if device_id:
            filter_expressions.append("device_id = :device_id")
            expression_attribute_values[':device_id'] = device_id
        
        if severity:
            filter_expressions.append("severity = :severity")
            expression_attribute_values[':severity'] = severity.value
        
        # Perform scan with optional filters
        scan_kwargs = {'Limit': limit}
        
        if filter_expressions:
            scan_kwargs['FilterExpression'] = ' AND '.join(filter_expressions)
            scan_kwargs['ExpressionAttributeValues'] = expression_attribute_values
        
        response = table.scan(**scan_kwargs)
        items = response.get('Items', [])
        
        # Convert DynamoDB items to AlertResponse models
        alerts = []
        for item in items:
            alerts.append(AlertResponse(
                alert_id=item['alert_id'],
                house_id=item['house_id'],
                device_id=item.get('device_id'),
                severity=AlertSeverity(item['severity']),
                message=item['message'],
                timestamp=datetime.fromisoformat(item['timestamp']),
                is_read=item.get('is_read', False)
            ))
        
        # Sort by timestamp (most recent first)
        alerts.sort(key=lambda x: x.timestamp, reverse=True)
        
        return alerts
    
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve alert history: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing alerts: {str(e)}"
        )

@router.put("/{alert_id}/config", response_model=MessageResponse)
async def update_alert_config(
    alert_id: str,
    config: AlertConfigUpdate,
    token: Optional[str] = Depends(optional_verify_token)
):
    """
    Update alert configuration
    
    Args:
        alert_id: ID of the alert to update
        config: New configuration settings
        
    Returns:
        Success message
    """
    # TODO: Implement alert config update logic
    return MessageResponse(
        message=f"Alert {alert_id} configuration updated successfully",
        success=True
    )

@router.get("/status", response_model=AlertStatus)
async def get_alert_status(
    house_id: Optional[str] = None,
    token: Optional[str] = Depends(optional_verify_token)
):
    """
    Get alert status summary
    
    Args:
        house_id: Filter by house ID (optional)
        
    Returns:
        Alert status summary
    """
    # TODO: Implement get alert status logic
    return AlertStatus(
        total_alerts=50,
        unread_alerts=5,
        critical_alerts=2
    )

@router.get("/data/stream", response_model=List[DataStream])
async def get_data_stream(
    device_id: Optional[str] = None,
    metric: Optional[str] = None,
    limit: int = 100,
    token: Optional[str] = Depends(optional_verify_token)
):
    """
    Get real-time data stream from devices
    
    Args:
        device_id: Filter by device ID (optional)
        metric: Filter by metric name (optional)
        limit: Maximum number of data points to return
        
    Returns:
        List of data stream points
    """
    # TODO: Implement get data stream logic
    return [
        DataStream(
            device_id="device_123",
            metric="temperature",
            value=22.5,
            unit="celsius",
            timestamp=datetime.now()
        )
    ]
