from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import StreamingResponse
from typing import List, Optional
from datetime import datetime
import uuid
import io
import zipfile
import json
import logging
from models.device import (
    DeviceAdd,
    DeviceUpdate,
    DeviceControl,
    DeviceResponse,
    DeviceStatus
)
from models.common import MessageResponse
from core.dependencies import optional_verify_token, get_current_user, require_admin
from core.database import get_table, Tables
from core.aws_iot import iot_manager
from core.config import settings
from botocore.exceptions import ClientError

router = APIRouter(prefix="/devices", tags=["Device Management"])
logger = logging.getLogger(__name__)

def item_to_device_response(item: dict) -> DeviceResponse:
    """Convert DynamoDB item to DeviceResponse"""
    return DeviceResponse(
        device_id=item['device_id'],
        house_id=item['house_id'],
        name=item['name'],
        device_type=item['device_type'],
        location=item['location'],
        status=item.get('status', 'offline'),
        description=item.get('description'),
        thing_name=item.get('thing_name'),
        certificate_arn=item.get('certificate_arn'),
        certificates=item.get('certificates'),
        created_at=datetime.fromisoformat(item['created_at']),
        updated_at=datetime.fromisoformat(item['updated_at'])
    )

@router.get("/health")
async def health_check():
    """
    Health check endpoint for device service
    
    Returns:
        Health status
    """
    return {"status": "healthy", "service": "devices"}

@router.get("/")
async def root():
    """
    Root endpoint for device service
    
    Returns:
        Service information
    """
    return {
        "message": "Device Management Service",
        "version": "1.0.0",
        "endpoints": [
            "/devices/add",
            "/devices/",
            "/devices/house/{house_id}",
            "/devices/{device_id}",
            "/devices/{device_id}/status",
            "/devices/{device_id}/config",
            "/devices/{device_id}/control",
        ]
    }

@router.post("/add", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def add_device(
    device: DeviceAdd,
    current_user: dict = Depends(require_admin)
):
    """
    Register a new IoT device to a specific house
    **Admin only** - Caregivers cannot add devices
    
    Args:
        device: Device information to register (must include valid house_id)
        
    Returns:
        Registered device information
    """
    # Validate that the house exists
    houses_table = get_table(Tables.HOUSES)
    try:
        house_response = houses_table.get_item(Key={'house_id': device.house_id})
        
        if 'Item' not in house_response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"House with ID '{device.house_id}' not found. Please create the house first."
            )
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate house: {str(e)}"
        )
    
    # Now create the device
    table = get_table(Tables.DEVICES)
    
    device_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    device_item = {
        'device_id': device_id,
        'house_id': device.house_id,
        'name': device.name,
        'device_type': device.device_type.value,
        'location': device.location,
        'description': device.description,
        'status': 'offline',
        'created_at': now,
        'updated_at': now
    }
    
    try:
        table.put_item(Item=device_item)
        
        return DeviceResponse(
            device_id=device_id,
            house_id=device.house_id,
            name=device.name,
            device_type=device.device_type.value,
            location=device.location,
            status='offline',
            description=device.description,
            created_at=datetime.fromisoformat(now),
            updated_at=datetime.fromisoformat(now)
        )
    
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add device: {str(e)}"
        )

@router.get("", response_model=List[DeviceResponse])
async def list_devices(
    house_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    List all devices, optionally filtered by house
    **Read-only for caregivers** - All authenticated users can view devices
    
    Args:
        house_id: Filter by house ID (optional)
        
    Returns:
        List of devices
    """
    table = get_table(Tables.DEVICES)
    
    try:
        scan_kwargs = {}
        
        if house_id:
            scan_kwargs['FilterExpression'] = 'house_id = :house_id'
            scan_kwargs['ExpressionAttributeValues'] = {':house_id': house_id}
        
        response = table.scan(**scan_kwargs)
        items = response.get('Items', [])
        
        # Handle pagination
        while 'LastEvaluatedKey' in response:
            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
            response = table.scan(**scan_kwargs)
            items.extend(response.get('Items', []))
        
        devices = []
        for item in items:
            devices.append(item_to_device_response(item))
        
        return devices
    
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve devices: {str(e)}"
        )

@router.get("/house/{house_id}", response_model=List[DeviceResponse])
async def list_devices_by_house(
    house_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    List all devices for a specific house
    **Read-only for caregivers** - All authenticated users can view devices
    
    Args:
        house_id: ID of the house
        
    Returns:
        List of devices in the house
    """
    # First validate that the house exists
    houses_table = get_table(Tables.HOUSES)
    try:
        house_response = houses_table.get_item(Key={'house_id': house_id})
        
        if 'Item' not in house_response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"House with ID '{house_id}' not found"
            )
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate house: {str(e)}"
        )
    
    # Get devices for this house
    table = get_table(Tables.DEVICES)
    
    try:
        scan_kwargs = {
            'FilterExpression': 'house_id = :house_id',
            'ExpressionAttributeValues': {':house_id': house_id}
        }
        
        response = table.scan(**scan_kwargs)
        items = response.get('Items', [])
        
        # Handle pagination
        while 'LastEvaluatedKey' in response:
            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
            response = table.scan(**scan_kwargs)
            items.extend(response.get('Items', []))
        
        devices = []
        for item in items:
            devices.append(item_to_device_response(item))
        
        return devices
    
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve devices for house: {str(e)}"
        )

@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(
    device_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get device by ID
    **Read-only for caregivers** - All authenticated users can view device details
    
    Args:
        device_id: ID of the device
        
    Returns:
        Device information
    """
    table = get_table(Tables.DEVICES)
    
    try:
        response = table.get_item(Key={'device_id': device_id})
        
        if 'Item' not in response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found"
            )
        
        item = response['Item']
        return item_to_device_response(item)
    
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve device: {str(e)}"
        )

@router.get("/{device_id}/status", response_model=DeviceStatus)
async def get_device_status(
    device_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get device status
    **Read-only for caregivers** - All authenticated users can view device status
    
    Args:
        device_id: ID of the device
        
    Returns:
        Device status information
    """
    table = get_table(Tables.DEVICES)
    
    try:
        response = table.get_item(Key={'device_id': device_id})
        
        if 'Item' not in response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found"
            )
        
        item = response['Item']
        return DeviceStatus(
            device_id=item['device_id'],
            name=item['name'],
            status=item.get('status', 'offline'),
            is_online=item.get('status') == 'online',
            last_activity=datetime.fromisoformat(item['updated_at']),
            battery_level=item.get('battery_level')
        )
    
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve device status: {str(e)}"
        )

@router.put("/{device_id}/config", response_model=DeviceResponse)
async def update_device_config(
    device_id: str,
    device_update: DeviceUpdate,
    current_user: dict = Depends(require_admin)
):
    """
    Update device configuration
    **Admin only** - Caregivers cannot modify device configuration
    
    Args:
        device_id: ID of the device to update
        device_update: Updated device information
        
    Returns:
        Updated device information
    """
    table = get_table(Tables.DEVICES)
    
    try:
        # Check if device exists
        response = table.get_item(Key={'device_id': device_id})
        
        if 'Item' not in response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found"
            )
        
        # Build update expression
        update_expressions = []
        expression_attribute_values = {}
        expression_attribute_names = {}
        
        if device_update.name is not None:
            update_expressions.append("#n = :name")
            expression_attribute_values[':name'] = device_update.name
            expression_attribute_names['#n'] = 'name'
        
        if device_update.location is not None:
            update_expressions.append("location = :location")
            expression_attribute_values[':location'] = device_update.location
        
        if device_update.description is not None:
            update_expressions.append("description = :description")
            expression_attribute_values[':description'] = device_update.description
        
        if device_update.status is not None:
            update_expressions.append("#s = :status")
            expression_attribute_values[':status'] = device_update.status
            expression_attribute_names['#s'] = 'status'
        
        # Add updated_at
        update_expressions.append("updated_at = :updated_at")
        expression_attribute_values[':updated_at'] = datetime.now().isoformat()
        
        update_expression = "SET " + ", ".join(update_expressions)
        
        # Perform update
        update_kwargs = {
            'Key': {'device_id': device_id},
            'UpdateExpression': update_expression,
            'ExpressionAttributeValues': expression_attribute_values,
            'ReturnValues': 'ALL_NEW'
        }
        
        if expression_attribute_names:
            update_kwargs['ExpressionAttributeNames'] = expression_attribute_names
        
        response = table.update_item(**update_kwargs)
        
        item = response['Attributes']
        return item_to_device_response(item)
    
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update device: {str(e)}"
        )

@router.post("/{device_id}/control", response_model=MessageResponse)
async def control_device(
    device_id: str,
    control: DeviceControl,
    token: Optional[str] = Depends(optional_verify_token)
):
    """
    Send control command to device
    
    Args:
        device_id: ID of the device
        control: Control command and parameters
        
    Returns:
        Success message
    """
    # TODO: Implement device control logic (send to IoT Core)
    return MessageResponse(
        message=f"Control command '{control.action}' sent to device {device_id}",
        success=True
    )

@router.post("/{device_id}/provision", response_model=dict)
async def provision_device_certificates(
    device_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Provision AWS IoT certificates for a device
    Creates Thing in AWS IoT and generates certificates
    **Admin only** - Caregivers cannot provision devices
    
    Args:
        device_id: ID of the device to provision
        
    Returns:
        Certificate information and metadata
    """
    table = get_table(Tables.DEVICES)
    
    try:
        # Check if device exists
        response = table.get_item(Key={'device_id': device_id})
        
        if 'Item' not in response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found"
            )
        
        device = response['Item']
        thing_name = f"device_{device_id}"
        
        # Create device in AWS IoT with certificates
        iot_response = iot_manager.create_device_with_certificates(thing_name)
        
        # Store certificate data and ARN in database
        table.update_item(
            Key={'device_id': device_id},
            UpdateExpression='SET certificate_arn = :cert_arn, thing_name = :thing_name, certificates = :certs, updated_at = :updated_at',
            ExpressionAttributeValues={
                ':cert_arn': iot_response['certificate_arn'],
                ':thing_name': thing_name,
                ':certs': json.dumps(iot_response['certificates']),  # Store certificates as JSON
                ':updated_at': datetime.now().isoformat()
            }
        )
        
        return {
            'device_id': device_id,
            'thing_name': thing_name,
            'certificate_id': iot_response['certificate_id'],
            'endpoint': iot_response['certificates']['endpoint'],
            'message': 'Device provisioned successfully. Use /download-certificates endpoint to get certificate files.'
        }
    
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to provision device: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to provision device: {str(e)}"
        )

@router.get("/{device_id}/download-certificates")
async def download_device_certificates(
    device_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Download device certificates as a ZIP file
    Must call /provision first to generate certificates
    **Admin only** - Caregivers cannot download certificates
    
    Args:
        device_id: ID of the device
        
    Returns:
        ZIP file containing certificates and configuration
    """
    table = get_table(Tables.DEVICES)
    
    try:
        # Check if device exists and has been provisioned
        response = table.get_item(Key={'device_id': device_id})
        
        if 'Item' not in response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found"
            )
        
        device = response['Item']
        logger.info(f"Device found: {device_id}")
        
        thing_name = device.get('thing_name')
        certificates_json = device.get('certificates')
        
        logger.info(f"Thing name: {thing_name}, Certificates present: {bool(certificates_json)}")
        
        if not thing_name or not certificates_json:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Device not provisioned. Call /provision endpoint first."
            )
        
        # Parse stored certificates
        try:
            certificates = json.loads(certificates_json)
            logger.info(f"Successfully parsed certificates")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse certificates JSON: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Invalid certificate data. Please provision device again."
            )
        
        # Create ZIP file in memory
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Add certificate files
            zip_file.writestr('device-certificate.pem.crt', certificates['certificatePem'])
            zip_file.writestr('private-key.pem.key', certificates['privateKey'])
            zip_file.writestr('public-key.pem.key', certificates['publicKey'])
            
            # Download Amazon Root CA
            root_ca_content = """-----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF
ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6
b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL
MAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv
b3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXj
ca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM
9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qw
IFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6
VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L
93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQm
jgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMC
AYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUA
A4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDI
U5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUs
N+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vv
o/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU
5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpy
rqXRfboQnoZsG4q5WTP468SQvvG5
-----END CERTIFICATE-----"""
            zip_file.writestr('AmazonRootCA1.pem', root_ca_content)
            
            # Add configuration file
            config = {
                "device_id": device_id,
                "thing_name": thing_name,
                "house_id": device['house_id'],
                "device_name": device['name'],
                "device_type": device['device_type'],
                "location": device['location'],
                "aws_iot_endpoint": certificates['endpoint'],
                "mqtt_topic": f"house/{device['house_id']}/{device['location']}/{device['device_type']}",
                "certificate_files": {
                    "certificate": "device-certificate.pem.crt",
                    "private_key": "private-key.pem.key",
                    "public_key": "public-key.pem.key",
                    "root_ca": "AmazonRootCA1.pem"
                }
            }
            
            zip_file.writestr('config.json', json.dumps(config, indent=2))
            
            # Add README
            readme = f"""# Device Certificates for {device['name']}

## Files Included:
- device-certificate.pem.crt: Device certificate
- private-key.pem.key: Private key (KEEP SECURE!)
- public-key.pem.key: Public key
- AmazonRootCA1.pem: Amazon Root CA certificate
- config.json: Device configuration

## Setup Instructions:

1. Copy all files to your IoT device
2. Place them in the certs/ folder
3. Update your device code to use these certificates
4. Connect to AWS IoT endpoint: {certificates['endpoint']}

## IMPORTANT:
- Keep the private key secure
- Do not commit these files to version control
- These certificates are unique to device: {device_id}
"""
            zip_file.writestr('README.txt', readme)
        
        # Prepare ZIP for download
        zip_buffer.seek(0)
        
        return StreamingResponse(
            io.BytesIO(zip_buffer.read()),
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename=device_{device_id}_certificates.zip"
            }
        )
    
    except ClientError as e:
        logger.error(f"DynamoDB error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate certificates: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in download_device_certificates: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download certificates: {str(e)}"
        )

@router.delete("/{device_id}", response_model=MessageResponse)
async def delete_device(
    device_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Delete device from the system and AWS IoT
    **Admin only** - Caregivers cannot delete devices
    
    This will:
    1. Detach and delete certificates from AWS IoT
    2. Delete the Thing from AWS IoT
    3. Remove device record from DynamoDB
    
    Args:
        device_id: ID of the device to delete
        
    Returns:
        Success message
    """
    table = get_table(Tables.DEVICES)
    
    try:
        # Check if device exists
        response = table.get_item(Key={'device_id': device_id})
        
        if 'Item' not in response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found"
            )
        
        device = response['Item']
        device_name = device.get('name', device_id)
        
        logger.info(f"Deleting device: {device_name} ({device_id})")
        
        # Delete from AWS IoT if provisioned
        if device.get('thing_name') and device.get('certificate_arn'):
            try:
                logger.info(f"Deleting from AWS IoT: {device['thing_name']}")
                iot_manager.delete_device(
                    device['thing_name'],
                    device['certificate_arn']
                )
                logger.info(f"AWS IoT cleanup completed for: {device['thing_name']}")
            except Exception as e:
                logger.warning(f"Failed to delete from AWS IoT: {e}")
                # Continue with database deletion even if AWS IoT cleanup fails
        else:
            logger.info(f"Device not provisioned, skipping AWS IoT cleanup")
        
        # Delete the device from database
        table.delete_item(Key={'device_id': device_id})
        logger.info(f"Device deleted from database: {device_id}")
        
        return MessageResponse(
            message=f"Device '{device_name}' deleted successfully. All certificates and AWS IoT resources have been removed.",
            success=True
        )
    
    except ClientError as e:
        logger.error(f"Database error while deleting device {device_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete device: {str(e)}"
        )
