"""
DynamoDB connection and utility functions
"""
import boto3
from botocore.exceptions import ClientError
from typing import Optional
from core.config import settings

# Initialize DynamoDB resource
def get_dynamodb_resource():
    """
    Get DynamoDB resource
    
    Returns:
        boto3.resource: DynamoDB resource
    """
    # Only use endpoint_url if it's actually set (not empty string)
    kwargs = {
        'region_name': settings.aws_region,
    }
    
    if settings.aws_access_key_id:
        kwargs['aws_access_key_id'] = settings.aws_access_key_id
    
    if settings.aws_secret_access_key:
        kwargs['aws_secret_access_key'] = settings.aws_secret_access_key
    
    # Only add endpoint_url if it's not None and not empty string
    if settings.dynamodb_endpoint_url and settings.dynamodb_endpoint_url.strip():
        kwargs['endpoint_url'] = settings.dynamodb_endpoint_url
    
    return boto3.resource('dynamodb', **kwargs)

def get_dynamodb_client():
    """
    Get DynamoDB client
    
    Returns:
        boto3.client: DynamoDB client
    """
    kwargs = {
        'region_name': settings.aws_region,
    }
    
    if settings.aws_access_key_id:
        kwargs['aws_access_key_id'] = settings.aws_access_key_id
    
    if settings.aws_secret_access_key:
        kwargs['aws_secret_access_key'] = settings.aws_secret_access_key
    
    # Only add endpoint_url if it's not None and not empty string
    if settings.dynamodb_endpoint_url and settings.dynamodb_endpoint_url.strip():
        kwargs['endpoint_url'] = settings.dynamodb_endpoint_url
    
    return boto3.client('dynamodb', **kwargs)

def get_table(table_name: str):
    """
    Get a specific DynamoDB table
    
    Args:
        table_name: Name of the table
        
    Returns:
        boto3.resource.Table: DynamoDB table resource
    """
    dynamodb = get_dynamodb_resource()
    return dynamodb.Table(table_name)

# Table name constants
class Tables:
    USERS = "Users"  # Lowercase to match AWS table
    HOUSES = "Houses"
    DEVICES = "Devices"
    ALERTS = "Alerts"