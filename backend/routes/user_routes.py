from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timedelta
from typing import List
from jose import jwt

from models.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserAuth,
    AuthResponse
)
from models.common import MessageResponse
from core.dependencies import verify_token
from core.database import get_table, Tables
from core.config import settings
from botocore.exceptions import ClientError
import uuid
import bcrypt

# User management router
router = APIRouter(prefix="/users", tags=["User Management"])

@router.get("", response_model=List[dict])
async def get_all_users():
    """Get all users from DynamoDB"""
    table = get_table(Tables.USERS)
    
    try:
        response = table.scan()
        items = response.get('Items', [])
        
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            items.extend(response.get('Items', []))
        
        # Return items as-is (whatever fields are in DynamoDB)
        return items
    
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve users: {str(e)}"
        )

@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(user_id: str):
    """Get a specific user by ID"""
    table = get_table(Tables.USERS)
    
    try:
        response = table.get_item(Key={'user_id': user_id})
        
        if 'Item' not in response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        item = response['Item']
        return UserResponse(
            user_id=item['user_id'],
            username=item['email'],  # Use email as username
            email=item['email'],
            full_name=item['full_name'],
            role=item.get('role', 'user'),
            is_active=item.get('is_active', True),
            created_at=datetime.fromisoformat(item['created_at'])
        )
    
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )


# Authentication router - SEPARATE from user management
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])

@auth_router.post("/login", response_model=AuthResponse)
async def user_authentication(credentials: UserAuth):
    """
    Authenticate user and return access token
    
    Args:
        credentials: User login credentials (username is email)
        
    Returns:
        Access token and user information
    """
    table = get_table(Tables.USERS)
    
    try:
        # Scan for user by email (username is email)
        response = table.scan(
            FilterExpression='email = :email',
            ExpressionAttributeValues={':email': credentials.username}
        )
        
        items = response.get('Items', [])
        
        if not items:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        user = items[0]
        
        # Verify password
        password_bytes = credentials.password.encode('utf-8')
        stored_hash = user['password_hash'].encode('utf-8')
        
        if not bcrypt.checkpw(password_bytes, stored_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Check if user is active
        if not user.get('is_active', True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        
        # Generate JWT token
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
        token_data = {
            "sub": user['user_id'],
            "email": user['email'],
            "role": user.get('role', 'user'),
            "exp": expire
        }
        
        access_token = jwt.encode(
            token_data,
            settings.secret_key,
            algorithm=settings.algorithm
        )
        
        return AuthResponse(
            access_token=access_token,
            token_type="Bearer",
            user_id=user['user_id']
        )
    
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    """Create a new user in DynamoDB"""
    table = get_table(Tables.USERS)
    
    user_id = str(uuid.uuid4())
    
    # Hash password using bcrypt
    password_bytes = user.password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
    
    # Skip email check for now (no index in DynamoDB)
    
    now = datetime.now().isoformat()
    user_item = {
        'user_id': user_id,
        'email': user.email,  # email is the username
        'password_hash': hashed_password,
        'full_name': user.full_name,
        'role': user.role,
        'is_active': True,
        'created_at': now,
        'updated_at': now
    }
    
    try:
        table.put_item(Item=user_item)
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )
    
    return UserResponse(
        user_id=user_id,
        username=user.email,  # Return email as username
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=True,
        created_at=datetime.fromisoformat(now)
    )

@router.put("/{user_id}/config", response_model=UserResponse)
async def update_user_config(
    user_id: str,
    user_update: UserUpdate,
    token: str = Depends(verify_token)
):
    """Update user configuration"""
    # TODO: Implement user update logic
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Not implemented"
    )

@router.delete("/{user_id}", response_model=MessageResponse)
async def delete_user(user_id: str):
    """Delete a user from the system"""
    table = get_table(Tables.USERS)
    
    try:
        # Check if user exists first
        response = table.get_item(Key={'user_id': user_id})
        
        if 'Item' not in response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Delete the user
        table.delete_item(Key={'user_id': user_id})
        
        return MessageResponse(
            message=f"User {user_id} deleted successfully",
            success=True
        )
    
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )