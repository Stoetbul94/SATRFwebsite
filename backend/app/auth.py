from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings
from app.models import UserRole
from app.database import db
import secrets
import hashlib

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT token security
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token"""
    to_encode = data.copy()
    # Refresh tokens last longer (7 days)
    expire = datetime.utcnow() + timedelta(days=7)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        return None


def verify_refresh_token(token: str) -> Optional[dict]:
    """Verify and decode a refresh token"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get the current authenticated user from the JWT token"""
    token = credentials.credentials
    
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if it's an access token
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    user = await db.get_document(settings.firestore_collection_users, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_active_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Get the current active user"""
    if not current_user.get("isActive", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def require_role(required_role: UserRole):
    """Decorator to require a specific user role"""
    def role_checker(current_user: dict = Depends(get_current_active_user)) -> dict:
        user_role = current_user.get("role", UserRole.USER)
        
        # Admin can access everything
        if user_role == UserRole.ADMIN:
            return current_user
        
        # Check if user has required role
        if user_role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        return current_user
    
    return role_checker


# Role-based dependencies
require_admin = require_role(UserRole.ADMIN)
require_event_scorer = require_role(UserRole.EVENT_SCORER)


async def authenticate_user(email: str, password: str) -> Optional[dict]:
    """Authenticate a user with email and password"""
    try:
        # Get user by email
        user = await db.get_document_by_field(settings.firestore_collection_users, "email", email)
        
        if not user:
            return None
        
        # Verify password
        if not verify_password(password, user.get("hashedPassword", "")):
            return None
        
        return user
        
    except Exception as e:
        print(f"Error authenticating user: {e}")
        return None


def create_user_token_data(user: dict) -> dict:
    """Create token data for a user"""
    return {
        "sub": user["id"],
        "email": user["email"],
        "role": user.get("role", UserRole.USER)
    }


async def create_user_session(user_id: str, request: Request) -> str:
    """Create a new user session"""
    session_id = secrets.token_urlsafe(32)
    
    session_data = {
        "session_id": session_id,
        "user_id": user_id,
        "ip_address": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
        "created_at": datetime.utcnow().isoformat(),
        "last_activity": datetime.utcnow().isoformat(),
        "is_active": True
    }
    
    await db.create_document("user_sessions", session_data)
    return session_id


async def update_user_session_activity(session_id: str):
    """Update session last activity"""
    await db.update_document(
        "user_sessions",
        session_id,
        {"last_activity": datetime.utcnow().isoformat()}
    )


async def invalidate_user_session(session_id: str):
    """Invalidate a user session"""
    await db.update_document(
        "user_sessions",
        session_id,
        {"is_active": False}
    )


async def log_user_activity(user_id: str, action: str, request: Request, details: Optional[Dict[str, Any]] = None):
    """Log user activity for audit purposes"""
    activity_data = {
        "user_id": user_id,
        "action": action,
        "details": details or {},
        "ip_address": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
        "timestamp": datetime.utcnow().isoformat()
    }
    
    await db.create_document("user_activity_logs", activity_data)


def sanitize_input(input_string: str) -> str:
    """Sanitize user input to prevent injection attacks"""
    if not input_string:
        return input_string
    
    # Remove potentially dangerous characters
    dangerous_chars = ['<', '>', '"', "'", '&', ';', '(', ')', '{', '}', '[', ']']
    sanitized = input_string
    for char in dangerous_chars:
        sanitized = sanitized.replace(char, '')
    
    return sanitized.strip()


def validate_password_strength(password: str) -> Dict[str, Any]:
    """Validate password strength and return detailed feedback"""
    errors = []
    warnings = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    
    if not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not any(c.islower() for c in password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one number")
    
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        warnings.append("Consider adding special characters for better security")
    
    if len(password) < 12:
        warnings.append("Consider using a longer password (12+ characters)")
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "strength_score": max(0, 10 - len(errors) * 2)
    }


def generate_password_reset_token() -> str:
    """Generate a secure password reset token"""
    return secrets.token_urlsafe(32)


def hash_password_reset_token(token: str) -> str:
    """Hash a password reset token for storage"""
    return hashlib.sha256(token.encode()).hexdigest()


def verify_password_reset_token(stored_hash: str, provided_token: str) -> bool:
    """Verify a password reset token"""
    provided_hash = hashlib.sha256(provided_token.encode()).hexdigest()
    return stored_hash == provided_hash 