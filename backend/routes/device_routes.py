from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
import uuid

from models.device import (
    DeviceAdd,
    DeviceUpdate,
    DeviceControl,
    DeviceResponse,
    DeviceStatus
)
from models.common import MessageResponse
from core.dependencies import verify_token
from core.database import get_table, Tables
from botocore.exceptions import ClientError

router = APIRouter(prefix="/devices", tags=["Device Management"])

@router.post("", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def add_device(device: DeviceAdd, token: str = Depends(verify_token)):
    """
    Add a new device to a house
    
    Args:
        device: Device information to add
        
    Returns:
        Created device information
    """
    houses_table = get_table(Tables.HOUSES)
    devices_table = get_table(Tables.DEVICES)
    
    try:
        # Verify that the house exists
        house_response = houses_table.get_item(Key={'house_id': device.house_id})
        
        if 'Item' not in house_response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"House {device.house_id} not found"
            )
        
        house = house_response['Item']
        
        # Generate device ID
        device_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        # Create device item
        device_item = {
            'device_id': device_id,
            'house_id': device.house_id,
            'name': device.name,
            'device_type': device.device_type.value,
            'location': device.location,
            'status': 'active',
            'description': device.description,
            'created_at': now,
            'updated_at': now
        }
        
        # Add device to Devices table
        devices_table.put_item(Item=device_item)
        
        # Update house's device list
        current_devices = house.get('devices', [])
        current_devices.append(device_id)
        
        houses_table.update_item(
            Key={'house_id': device.house_id},
            UpdateExpression='SET devices = :devices, updated_at = :updated_at',
            ExpressionAttributeValues={
                ':devices': current_devices,
                ':updated_at': now
            }
        )
        
        return DeviceResponse(
            device_id=device_id,
            house_id=device.house_id,
            name=device.name,
            device_type=device.device_type.value,
            location=device.location,
            status='active',
            description=device.description,
            created_at=datetime.fromisoformat(now),
            updated_at=datetime.fromisoformat(now)
        )
    
    except HTTPException:
        raise
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add device: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding device: {str(e)}"
        )

@router.delete("/{device_id}", response_model=MessageResponse)
async def remove_device(device_id: str, token: str = Depends(verify_token)):
    """
    Remove a device from the system
    
    Args:
        device_id: ID of the device to remove
        
    Returns:
        Success message
    """
    devices_table = get_table(Tables.DEVICES)
    houses_table = get_table(Tables.HOUSES)
    
    try:
        # Get the device to find its house_id
        device_response = devices_table.get_item(Key={'device_id': device_id})
        
        if 'Item' not in device_response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Device {device_id} not found"
            )
        
        device = device_response['Item']
        house_id = device['house_id']
        
        # Remove device from Devices table
        devices_table.delete_item(Key={'device_id': device_id})
        
        # Remove device from house's device list
        house_response = houses_table.get_item(Key={'house_id': house_id})
        
        if 'Item' in house_response:
            house = house_response['Item']
            current_devices = house.get('devices', [])
            
            if device_id in current_devices:
                current_devices.remove(device_id)
                
                houses_table.update_item(
                    Key={'house_id': house_id},
                    UpdateExpression='SET devices = :devices, updated_at = :updated_at',
                    ExpressionAttributeValues={
                        ':devices': current_devices,
                        ':updated_at': datetime.now().isoformat()
                    }
                )
        
        return MessageResponse(
            message=f"Device {device_id} removed successfully",
            success=True
        )
    
    except HTTPException:
        raise
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove device: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error removing device: {str(e)}"
        )

@router.put("/{device_id}", response_model=DeviceResponse)
async def update_device(
    device_id: str,
    device_update: DeviceUpdate,
    token: str = Depends(verify_token)
):
    """
    Update device information
    
    Args:
        device_id: ID of the device to update
        device_update: Updated device information
        
    Returns:
        Updated device information
    """
    devices_table = get_table(Tables.DEVICES)
    
    try:
        # Get existing device
        device_response = devices_table.get_item(Key={'device_id': device_id})
        
        if 'Item' not in device_response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Device {device_id} not found"
            )
        
        device = device_response['Item']
        
        # Build update expression dynamically
        update_expressions = []
        expression_attribute_values = {}
        
        if device_update.name is not None:
            update_expressions.append("name = :name")
            expression_attribute_values[':name'] = device_update.name
        
        if device_update.location is not None:
            update_expressions.append("location = :location")
            expression_attribute_values[':location'] = device_update.location
        
        if device_update.description is not None:
            update_expressions.append("description = :description")
            expression_attribute_values[':description'] = device_update.description
        
        if device_update.status is not None:
            update_expressions.append("status = :status")
            expression_attribute_values[':status'] = device_update.status
        
        # Always update updated_at
        update_expressions.append("updated_at = :updated_at")
        expression_attribute_values[':updated_at'] = datetime.now().isoformat()
        
        if not update_expressions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        # Update the device
        update_expression = "SET " + ", ".join(update_expressions)
        
        devices_table.update_item(
            Key={'device_id': device_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values
        )
        
        # Get updated device
        updated_response = devices_table.get_item(Key={'device_id': device_id})
        updated_device = updated_response['Item']
        
        return DeviceResponse(
            device_id=updated_device['device_id'],
            house_id=updated_device['house_id'],
            name=updated_device['name'],
            device_type=updated_device['device_type'],
            location=updated_device['location'],
            status=updated_device['status'],
            description=updated_device.get('description'),
            created_at=datetime.fromisoformat(updated_device['created_at']),
            updated_at=datetime.fromisoformat(updated_device['updated_at'])
        )
    
    except HTTPException:
        raise
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update device: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating device: {str(e)}"
        )

@router.get("/{device_id}/status", response_model=DeviceStatus)
async def get_device_status(device_id: str, token: str = Depends(verify_token)):
    """
    Get the status of a specific device
    
    Args:
        device_id: ID of the device
        
    Returns:
        Device status information
    """
    devices_table = get_table(Tables.DEVICES)
    
    try:
        # Get device from DynamoDB
        device_response = devices_table.get_item(Key={'device_id': device_id})
        
        if 'Item' not in device_response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Device {device_id} not found"
            )
        
        device = device_response['Item']
        
        # Parse last_activity if it exists, otherwise use created_at
        last_activity_str = device.get('last_activity', device.get('updated_at', device['created_at']))
        
        return DeviceStatus(
            device_id=device['device_id'],
            name=device['name'],
            status=device.get('status', 'active'),
            is_online=device.get('is_online', True),
            last_activity=datetime.fromisoformat(last_activity_str),
            battery_level=device.get('battery_level')
        )
    
    except HTTPException:
        raise
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get device status: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving device status: {str(e)}"
        )

@router.post("/{device_id}/control", response_model=MessageResponse)
async def control_device(
    device_id: str,
    control: DeviceControl,
    token: str = Depends(verify_token)
):
    """
    Control a device (turn on/off, adjust settings, etc.)
    
    Args:
        device_id: ID of the device to control
        control: Control action and parameters
        
    Returns:
        Success message
    """
    devices_table = get_table(Tables.DEVICES)
    
    try:
        # Verify device exists
        device_response = devices_table.get_item(Key={'device_id': device_id})
        
        if 'Item' not in device_response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Device {device_id} not found"
            )
        
        device = device_response['Item']
        now = datetime.now().isoformat()
        
        # Update device based on control action
        update_expressions = []
        expression_attribute_values = {}
        
        # Handle common control actions
        if control.action.lower() in ['on', 'turn_on', 'enable']:
            update_expressions.append("status = :status")
            expression_attribute_values[':status'] = 'on'
        
        elif control.action.lower() in ['off', 'turn_off', 'disable']:
            update_expressions.append("status = :status")
            expression_attribute_values[':status'] = 'off'
        
        elif control.action.lower() == 'toggle':
            current_status = device.get('status', 'off')
            new_status = 'off' if current_status == 'on' else 'on'
            update_expressions.append("status = :status")
            expression_attribute_values[':status'] = new_status
        
        # Store control parameters if provided
        if control.parameters:
            update_expressions.append("control_parameters = :params")
            expression_attribute_values[':params'] = control.parameters
        
        # Update last_activity and updated_at
        update_expressions.append("last_activity = :last_activity")
        update_expressions.append("updated_at = :updated_at")
        expression_attribute_values[':last_activity'] = now
        expression_attribute_values[':updated_at'] = now
        
        if update_expressions:
            update_expression = "SET " + ", ".join(update_expressions)
            
            devices_table.update_item(
                Key={'device_id': device_id},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_attribute_values
            )
        
        return MessageResponse(
            message=f"Device {device_id} control action '{control.action}' executed successfully",
            success=True
        )
    
    except HTTPException:
        raise
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to control device: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error controlling device: {str(e)}"
        )
