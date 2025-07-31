from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer
from datetime import timedelta, datetime
import secrets
from app.models import UserCreate, UserResponse, LoginRequest, TokenResponse, APIResponse, PasswordResetRequest, PasswordResetConfirm
from app.auth import get_password_hash, authenticate_user, create_access_token, create_user_token_data, get_current_user
from app.database import db
from app.config import settings
from app.email import email_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Register a new user
    
    - **firstName**: User's first name (2-50 characters)
    - **lastName**: User's last name (2-50 characters)
    - **email**: Valid email address
    - **password**: Password (min 8 chars, must contain uppercase, lowercase, and number)
    - **membershipType**: junior, senior, or veteran
    - **club**: User's club name (2-100 characters)
    """
    try:
        # Check if user already exists
        existing_user = await db.get_document_by_field(
            settings.firestore_collection_users, 
            "email", 
            user_data.email
        )
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        # Hash password
        hashed_password = get_password_hash(user_data.password)
        
        # Prepare user data for storage
        user_dict = user_data.dict()
        user_dict.pop("password")  # Remove plain password
        user_dict["hashedPassword"] = hashed_password
        user_dict["role"] = "user"  # Default role
        user_dict["isActive"] = True
        
        # Create user in database
        user_id = await db.create_document(
            settings.firestore_collection_users, 
            user_dict
        )
        
        # Get created user
        created_user = await db.get_document(
            settings.firestore_collection_users, 
            user_id
        )
        
        # Send registration confirmation email
        try:
            confirmation_token = secrets.token_urlsafe(32)
            confirmation_url = f"http://localhost:3000/confirm-email?token={confirmation_token}"
            
            # Store confirmation token in database
            await db.update_document(
                settings.firestore_collection_users,
                user_id,
                {
                    "emailConfirmationToken": confirmation_token,
                    "emailConfirmed": False,
                    "emailConfirmationExpires": datetime.utcnow().isoformat()
                }
            )
            
            # Send confirmation email
            await email_service.send_registration_confirmation(
                to_email=user_data.email,
                user_name=f"{user_data.firstName} {user_data.lastName}",
                confirmation_url=confirmation_url
            )
        except Exception as e:
            print(f"Failed to send registration email: {e}")
            # Don't fail registration if email fails
        
        return APIResponse(
            success=True,
            message="User registered successfully",
            data={
                "user": {
                    "id": created_user["id"],
                    "firstName": created_user["firstName"],
                    "lastName": created_user["lastName"],
                    "email": created_user["email"],
                    "membershipType": created_user["membershipType"],
                    "club": created_user["club"],
                    "role": created_user["role"],
                    "createdAt": created_user["createdAt"]
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error registering user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest):
    """
    Login user and return access token
    
    - **email**: User's email address
    - **password**: User's password
    """
    try:
        # Authenticate user
        user = await authenticate_user(login_data.email, login_data.password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user is active
        if not user.get("isActive", True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        # Create access token
        token_data = create_user_token_data(user)
        access_token = create_access_token(token_data)
        
        # Calculate expiration time
        expires_in = settings.access_token_expire_minutes * 60  # Convert to seconds
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=expires_in,
            user=UserResponse(
                id=user["id"],
                firstName=user["firstName"],
                lastName=user["lastName"],
                email=user["email"],
                membershipType=user["membershipType"],
                club=user["club"],
                role=user.get("role", "user"),
                profileImageUrl=user.get("profileImageUrl"),
                createdAt=user["createdAt"],
                updatedAt=user.get("updatedAt")
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error logging in user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/logout", response_model=APIResponse)
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout user (client should discard token)
    """
    # In a stateless JWT system, logout is handled client-side
    # The server doesn't maintain session state
    return APIResponse(
        success=True,
        message="Successfully logged out"
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Get current user information
    """
    return UserResponse(
        id=current_user["id"],
        firstName=current_user["firstName"],
        lastName=current_user["lastName"],
        email=current_user["email"],
        membershipType=current_user["membershipType"],
        club=current_user["club"],
        role=current_user.get("role", "user"),
        profileImageUrl=current_user.get("profileImageUrl"),
        createdAt=current_user["createdAt"],
        updatedAt=current_user.get("updatedAt")
    )


@router.post("/forgot-password", response_model=APIResponse)
async def forgot_password(request: PasswordResetRequest):
    """
    Request password reset
    
    - **email**: User's email address
    """
    try:
        # Find user by email
        user = await db.get_document_by_field(
            settings.firestore_collection_users,
            "email",
            request.email
        )
        
        if not user:
            # Don't reveal if user exists or not for security
            return APIResponse(
                success=True,
                message="If the email exists, a password reset link has been sent"
            )
        
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        reset_expires = datetime.utcnow().isoformat()
        
        # Store reset token in database
        await db.update_document(
            settings.firestore_collection_users,
            user["id"],
            {
                "passwordResetToken": reset_token,
                "passwordResetExpires": reset_expires
            }
        )
        
        # Send password reset email
        reset_url = f"http://localhost:3000/reset-password?token={reset_token}"
        
        await email_service.send_password_reset(
            to_email=user["email"],
            user_name=f"{user['firstName']} {user['lastName']}",
            reset_url=reset_url,
            expiry_hours=24
        )
        
        return APIResponse(
            success=True,
            message="If the email exists, a password reset link has been sent"
        )
        
    except Exception as e:
        print(f"Error in forgot password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/reset-password", response_model=APIResponse)
async def reset_password(request: PasswordResetConfirm):
    """
    Reset password with token
    
    - **token**: Password reset token
    - **newPassword**: New password
    """
    try:
        # Find user by reset token
        user = await db.get_document_by_field(
            settings.firestore_collection_users,
            "passwordResetToken",
            request.token
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Check if token is expired (24 hours)
        reset_expires = datetime.fromisoformat(user.get("passwordResetExpires", "1970-01-01T00:00:00"))
        if datetime.utcnow() > reset_expires:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired"
            )
        
        # Hash new password
        hashed_password = get_password_hash(request.newPassword)
        
        # Update user password and clear reset token
        await db.update_document(
            settings.firestore_collection_users,
            user["id"],
            {
                "hashedPassword": hashed_password,
                "passwordResetToken": None,
                "passwordResetExpires": None,
                "updatedAt": datetime.utcnow().isoformat()
            }
        )
        
        return APIResponse(
            success=True,
            message="Password reset successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error resetting password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/confirm-email", response_model=APIResponse)
async def confirm_email(token: str):
    """
    Confirm email address with token
    
    - **token**: Email confirmation token
    """
    try:
        # Find user by confirmation token
        user = await db.get_document_by_field(
            settings.firestore_collection_users,
            "emailConfirmationToken",
            token
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid confirmation token"
            )
        
        # Update user to confirmed
        await db.update_document(
            settings.firestore_collection_users,
            user["id"],
            {
                "emailConfirmed": True,
                "emailConfirmationToken": None,
                "emailConfirmationExpires": None,
                "updatedAt": datetime.utcnow().isoformat()
            }
        )
        
        return APIResponse(
            success=True,
            message="Email confirmed successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error confirming email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        ) 