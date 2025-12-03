from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends, HTTPException, status
from typing import Optional
from jose import jwt, JWTError
from core.config import settings

security = HTTPBearer(auto_error=False)  # auto_error=False makes it optional

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Verify JWT token and extract user information
    
    Args:
        credentials: HTTP Bearer token credentials
        
    Returns:
        dict: Decoded token payload with user info
        
    Raises:
        HTTPException: If token is invalid
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = credentials.credentials
    
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )

async def optional_verify_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    """
    Optional token verification - allows requests with or without authentication
    
    Args:
        credentials: HTTP Bearer token credentials (optional)
        
    Returns:
        Optional[dict]: Decoded token payload or None if no token provided
    """
    if credentials is None:
        return None
    
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        return payload
    except JWTError:
        return None

async def get_current_user(token_payload: dict = Depends(verify_token)) -> dict:
    """
    Get current authenticated user from token
    
    Args:
        token_payload: Decoded JWT token payload
        
    Returns:
        dict: Current user information
    """
    return {
        "user_id": token_payload.get("sub"),
        "email": token_payload.get("email"),
        "role": token_payload.get("role", "caregiver")
    }

async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    """
    Get current user but allow unauthenticated access (for development)
    
    Args:
        credentials: Optional HTTP Bearer token credentials
        
    Returns:
        Optional[dict]: Current user information or None
    """
    if credentials is None:
        # Allow unauthenticated access - return a default user
        return {
            "user_id": "anonymous",
            "email": "anonymous@dev.local",
            "role": "admin"  # Give admin role for development
        }
    
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        return {
            "user_id": payload.get("sub"),
            "email": payload.get("email"),
            "role": payload.get("role", "caregiver")
        }
    except JWTError:
        # If token is invalid, still allow access with anonymous user
        return {
            "user_id": "anonymous",
            "email": "anonymous@dev.local",
            "role": "admin"
        }

async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Require admin role for the endpoint
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        dict: Current user information
        
    Raises:
        HTTPException: If user is not an admin
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
