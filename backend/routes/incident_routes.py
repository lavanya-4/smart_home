from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional, List
from datetime import datetime
import uuid

from models.alert import AlertResponse, AlertSeverity
from models.common import MessageResponse
from core.dependencies import optional_verify_token
from core.database import get_table, Tables
from botocore.exceptions import ClientError

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("/", response_model=List[AlertResponse])
async def get_incidents(
    house_id: Optional[str] = None,
    device_id: Optional[str] = None,
    severity: Optional[AlertSeverity] = None,
    limit: int = 100,
    token: Optional[str] = Depends(optional_verify_token)
):
    """
    Get incidents/alerts with optional filters
    
    Args:
        house_id: Filter by house ID
        device_id: Filter by device ID
        severity: Filter by severity level
        limit: Maximum number of incidents to return
        
    Returns:
        List of incidents
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
        incidents = []
        for item in items:
            incidents.append(AlertResponse(
                alert_id=item['alert_id'],
                house_id=item['house_id'],
                device_id=item.get('device_id'),
                severity=AlertSeverity(item['severity']),
                message=item['message'],
                timestamp=datetime.fromisoformat(item['timestamp']),
                is_read=item.get('is_read', False)
            ))
        
        # Sort by timestamp (most recent first)
        incidents.sort(key=lambda x: x.timestamp, reverse=True)
        
        return incidents
    
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve incidents: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing incidents: {str(e)}"
        )

@router.get("/{incident_id}", response_model=AlertResponse)
async def get_incident(
    incident_id: str,
    token: Optional[str] = Depends(optional_verify_token)
):
    """Get a specific incident by ID"""
    table = get_table(Tables.ALERTS)
    
    try:
        response = table.get_item(Key={'alert_id': incident_id})
        
        if 'Item' not in response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Incident not found"
            )
        
        item = response['Item']
        return AlertResponse(
            alert_id=item['alert_id'],
            house_id=item['house_id'],
            device_id=item.get('device_id'),
            severity=AlertSeverity(item['severity']),
            message=item['message'],
            timestamp=datetime.fromisoformat(item['timestamp']),
            is_read=item.get('is_read', False)
        )
        
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve incident: {str(e)}"
        )

@router.patch("/{incident_id}/read", response_model=MessageResponse)
async def mark_incident_read(
    incident_id: str,
    token: Optional[str] = Depends(optional_verify_token)
):
    """Mark an incident as read"""
    table = get_table(Tables.ALERTS)
    
    try:
        table.update_item(
            Key={'alert_id': incident_id},
            UpdateExpression='SET is_read = :is_read, updated_at = :updated_at',
            ExpressionAttributeValues={
                ':is_read': True,
                ':updated_at': datetime.now().isoformat()
            }
        )
        
        return MessageResponse(
            message=f"Incident {incident_id} marked as read",
            success=True
        )
        
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark incident as read: {str(e)}"
        )