from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from typing import Optional, List

from models.house import (
    HouseRegister,
    HouseResponse,
    HouseStatus,
    HouseConfigUpdate
)
from models.common import MessageResponse
from core.dependencies import optional_verify_token
from core.database import get_table, Tables
from botocore.exceptions import ClientError

router = APIRouter(prefix="/houses", tags=["Registration"])

@router.get("", response_model=List[HouseResponse])
async def list_houses(token: Optional[str] = Depends(optional_verify_token)):
    """
    Get all houses from the system with device counts
    
    Returns:
        List of all houses with device statistics
    """
    houses_table = get_table(Tables.HOUSES)
    devices_table = get_table(Tables.DEVICES)
    
    try:
        # Get all houses
        response = houses_table.scan()
        items = response.get('Items', [])
        
        # Handle pagination
        while 'LastEvaluatedKey' in response:
            response = houses_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            items.extend(response.get('Items', []))
        
        # Get all devices
        devices_response = devices_table.scan()
        all_devices = devices_response.get('Items', [])
        
        # Handle pagination for devices
        while 'LastEvaluatedKey' in devices_response:
            devices_response = devices_table.scan(ExclusiveStartKey=devices_response['LastEvaluatedKey'])
            all_devices.extend(devices_response.get('Items', []))
        
        houses = []
        for item in items:
            house_id = item['house_id']
            
            # Count devices for this house
            house_devices = [d for d in all_devices if d.get('house_id') == house_id]
            total_devices = len(house_devices)
            active_devices = len([d for d in house_devices if d.get('status') == 'online'])
            
            houses.append(HouseResponse(
                house_id=house_id,
                name=item['name'],
                address=item['address'],
                owner_id=item.get('owner_id', item.get('owner_name', '')),
                description=item.get('description', ''),
                status=item.get('status', 'active'),
                total_devices=total_devices,
                active_devices=active_devices,
                created_at=datetime.fromisoformat(item['created_at']),
                updated_at=datetime.fromisoformat(item['updated_at'])
            ))
        
        return houses
    
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve houses: {str(e)}"
        )

@router.post("/register", response_model=HouseResponse, status_code=status.HTTP_201_CREATED)
async def register_house(house: HouseRegister, token: Optional[str] = Depends(optional_verify_token)):
    """
    Register a new house in the system
    
    Args:
        house: House information to register
        
    Returns:
        Registered house information
    """
    # TODO: Implement house registration logic
    return HouseResponse(
        house_id="house_123",
        name=house.name,
        address=house.address,
        owner_id=house.owner_id,
        description=house.description,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

@router.get("/{house_id}/status", response_model=HouseStatus)
async def get_house_status(house_id: str, token: Optional[str] = Depends(optional_verify_token)):
    """
    Get the status of a specific house
    
    Args:
        house_id: ID of the house
        
    Returns:
        House status information
    """
    # TODO: Implement get house status logic
    return HouseStatus(
        house_id=house_id,
        name="My Smart Home",
        status="active",
        total_devices=10,
        active_devices=8
    )

@router.put("/{house_id}/config", response_model=HouseResponse)
async def update_house_config(
    house_id: str,
    config: HouseConfigUpdate,
    token: Optional[str] = Depends(optional_verify_token)
):
    """
    Update house configuration
    
    Args:
        house_id: ID of the house to update
        config: Updated configuration
        
    Returns:
        Updated house information
    """
    # TODO: Implement house config update logic
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Not implemented"
    )

@router.delete("/{house_id}", response_model=MessageResponse)
async def remove_house(house_id: str, token: Optional[str] = Depends(optional_verify_token)):
    """
    Remove a house from the system
    
    Args:
        house_id: ID of the house to remove
        
    Returns:
        Success message
    """
    # TODO: Implement house removal logic
    return MessageResponse(
        message=f"House {house_id} removed successfully",
        success=True
    )

