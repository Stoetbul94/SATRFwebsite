from fastapi import APIRouter, HTTPException, status, Depends, Request, BackgroundTasks
from fastapi.security import HTTPBearer
from datetime import timedelta, datetime
import secrets
from typing import List, Optional
from app.models import (
    UserCreate, UserResponse, LoginRequest, TokenResponse, APIResponse, 
    PasswordResetRequest, PasswordResetConfirm, UserProfile, UserProfileUpdate,
    UserScoreSummary, UserDashboardData, RefreshTokenRequest, RefreshTokenResponse,
    ChangePasswordRequest, EmailConfirmationRequest, UserActivityLog
)
from app.auth import (
    get_password_hash, authenticate_user, create_access_token, create_refresh_token,
    create_user_token_data, get_current_user, get_current_active_user, require_admin,
    create_user_session, update_user_session_activity, invalidate_user_session,
    log_user_activity, sanitize_input, validate_password_strength,
    generate_password_reset_token, hash_password_reset_token, verify_password_reset_token,
    verify_refresh_token
)
from app.database import db
from app.config import settings
from app.email import email_service

router = APIRouter(prefix="/users", tags=["User Management"])


@router.post("/register", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserCreate,
    request: Request,
    background_tasks: BackgroundTasks
):
    """
    Register a new user with comprehensive validation and security
    
    - **firstName**: User's first name (2-50 characters)
    - **lastName**: User's last name (2-50 characters)
    - **email**: Valid email address
    - **password**: Password (min 8 chars, must contain uppercase, lowercase, and number)
    - **membershipType**: junior, senior, or veteran
    - **club**: User's club name (2-100 characters)
    """
    try:
        # Sanitize inputs
        user_data.firstName = sanitize_input(user_data.firstName)
        user_data.lastName = sanitize_input(user_data.lastName)
        user_data.club = sanitize_input(user_data.club)
        
        # Validate password strength
        password_validation = validate_password_strength(user_data.password)
        if not password_validation["is_valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "Password does not meet security requirements",
                    "errors": password_validation["errors"],
                    "warnings": password_validation["warnings"]
                }
            )
        
        # Check if user already exists
        existing_user = await db.get_document_by_field(
            settings.firestore_collection_users, 
            "email", 
            user_data.email.lower()
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
        user_dict["email"] = user_data.email.lower()  # Normalize email
        user_dict["role"] = "user"  # Default role
        user_dict["isActive"] = True
        user_dict["emailConfirmed"] = False
        user_dict["createdAt"] = datetime.utcnow().isoformat()
        user_dict["loginCount"] = 0
        
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
        
        # Create user session
        session_id = await create_user_session(user_id, request)
        
        # Generate tokens
        token_data = create_user_token_data(created_user)
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        # Send registration confirmation email in background
        background_tasks.add_task(
            send_registration_email,
            user_data.email,
            f"{user_data.firstName} {user_data.lastName}",
            user_id
        )
        
        # Log user activity
        await log_user_activity(
            user_id, 
            "user_registered", 
            request, 
            {"email": user_data.email}
        )
        
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
                },
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_in": settings.access_token_expire_minutes * 60,
                "session_id": session_id
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error registering user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during registration"
        )


@router.post("/login", response_model=TokenResponse)
async def login_user(
    login_data: LoginRequest,
    request: Request
):
    """
    Authenticate user and return access tokens
    
    - **email**: User's email address
    - **password**: User's password
    """
    try:
        # Authenticate user
        user = await authenticate_user(login_data.email.lower(), login_data.password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        if not user.get("isActive", True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account is deactivated"
            )
        
        # Create user session
        session_id = await create_user_session(user["id"], request)
        
        # Generate tokens
        token_data = create_user_token_data(user)
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        # Update user login statistics
        login_count = user.get("loginCount", 0) + 1
        await db.update_document(
            settings.firestore_collection_users,
            user["id"],
            {
                "lastLoginAt": datetime.utcnow().isoformat(),
                "loginCount": login_count
            }
        )
        
        # Log user activity
        await log_user_activity(
            user["id"], 
            "user_login", 
            request, 
            {"session_id": session_id}
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60,
            user=UserResponse(
                id=user["id"],
                firstName=user["firstName"],
                lastName=user["lastName"],
                email=user["email"],
                membershipType=user["membershipType"],
                club=user["club"],
                role=user.get("role", "user"),
                profileImageUrl=user.get("profileImageUrl"),
                createdAt=datetime.fromisoformat(user["createdAt"]),
                updatedAt=datetime.fromisoformat(user["updatedAt"]) if user.get("updatedAt") else None
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_access_token(
    refresh_request: RefreshTokenRequest,
    request: Request
):
    """
    Refresh access token using refresh token
    """
    try:
        # Verify refresh token
        payload = verify_refresh_token(refresh_request.refresh_token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Get user from database
        user = await db.get_document(settings.firestore_collection_users, user_id)
        if not user or not user.get("isActive", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Generate new tokens
        token_data = create_user_token_data(user)
        access_token = create_access_token(token_data)
        new_refresh_token = create_refresh_token(token_data)
        
        # Log activity
        await log_user_activity(
            user_id, 
            "token_refreshed", 
            request
        )
        
        return RefreshTokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error refreshing token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during token refresh"
        )


@router.post("/logout", response_model=APIResponse)
async def logout_user(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Logout user and invalidate session
    """
    try:
        # Get session ID from request headers or token
        session_id = request.headers.get("X-Session-ID")
        
        if session_id:
            await invalidate_user_session(session_id)
        
        # Log activity
        await log_user_activity(
            current_user["id"], 
            "user_logout", 
            request
        )
        
        return APIResponse(
            success=True,
            message="Successfully logged out"
        )
        
    except Exception as e:
        print(f"Error during logout: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during logout"
        )


@router.get("/profile", response_model=UserProfile)
async def get_user_profile(
    current_user: dict = Depends(get_current_active_user),
    request: Request = None
):
    """
    Get current user's profile information
    """
    try:
        # Update session activity
        session_id = request.headers.get("X-Session-ID") if request else None
        if session_id:
            await update_user_session_activity(session_id)
        
        return UserProfile(
            id=current_user["id"],
            firstName=current_user["firstName"],
            lastName=current_user["lastName"],
            email=current_user["email"],
            membershipType=current_user["membershipType"],
            club=current_user["club"],
            role=current_user.get("role", "user"),
            profileImageUrl=current_user.get("profileImageUrl"),
            phoneNumber=current_user.get("phoneNumber"),
            dateOfBirth=current_user.get("dateOfBirth"),
            address=current_user.get("address"),
            emergencyContact=current_user.get("emergencyContact"),
            emergencyPhone=current_user.get("emergencyPhone"),
            isActive=current_user.get("isActive", True),
            emailConfirmed=current_user.get("emailConfirmed", False),
            createdAt=datetime.fromisoformat(current_user["createdAt"]),
            updatedAt=datetime.fromisoformat(current_user["updatedAt"]) if current_user.get("updatedAt") else None,
            lastLoginAt=datetime.fromisoformat(current_user["lastLoginAt"]) if current_user.get("lastLoginAt") else None,
            loginCount=current_user.get("loginCount", 0)
        )
        
    except Exception as e:
        print(f"Error getting user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.put("/profile", response_model=UserProfile)
async def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user: dict = Depends(get_current_active_user),
    request: Request = None
):
    """
    Update current user's profile information
    """
    try:
        # Sanitize inputs
        update_data = profile_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            if isinstance(value, str):
                update_data[key] = sanitize_input(value)
        
        # Add updated timestamp
        update_data["updatedAt"] = datetime.utcnow().isoformat()
        
        # Update user in database
        success = await db.update_document(
            settings.firestore_collection_users,
            current_user["id"],
            update_data
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update profile"
            )
        
        # Get updated user
        updated_user = await db.get_document(
            settings.firestore_collection_users,
            current_user["id"]
        )
        
        # Log activity
        await log_user_activity(
            current_user["id"], 
            "profile_updated", 
            request,
            {"updated_fields": list(update_data.keys())}
        )
        
        return UserProfile(
            id=updated_user["id"],
            firstName=updated_user["firstName"],
            lastName=updated_user["lastName"],
            email=updated_user["email"],
            membershipType=updated_user["membershipType"],
            club=updated_user["club"],
            role=updated_user.get("role", "user"),
            profileImageUrl=updated_user.get("profileImageUrl"),
            phoneNumber=updated_user.get("phoneNumber"),
            dateOfBirth=updated_user.get("dateOfBirth"),
            address=updated_user.get("address"),
            emergencyContact=updated_user.get("emergencyContact"),
            emergencyPhone=updated_user.get("emergencyPhone"),
            isActive=updated_user.get("isActive", True),
            emailConfirmed=updated_user.get("emailConfirmed", False),
            createdAt=datetime.fromisoformat(updated_user["createdAt"]),
            updatedAt=datetime.fromisoformat(updated_user["updatedAt"]) if updated_user.get("updatedAt") else None,
            lastLoginAt=datetime.fromisoformat(updated_user["lastLoginAt"]) if updated_user.get("lastLoginAt") else None,
            loginCount=updated_user.get("loginCount", 0)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/dashboard", response_model=UserDashboardData)
async def get_user_dashboard(
    current_user: dict = Depends(get_current_active_user),
    request: Request = None
):
    """
    Get user's dashboard data including profile, score summary, and recent activity
    """
    try:
        # Get user profile
        profile = await get_user_profile(current_user, request)
        
        # Get user's score summary
        score_summary = await get_user_score_summary(current_user["id"])
        
        # Get recent events (last 5)
        recent_events = await db.query_documents(
            settings.firestore_collection_events,
            order_by="date",
            limit=5
        )
        
        # Get upcoming events (next 5)
        upcoming_events = await db.query_documents(
            settings.firestore_collection_events,
            filters=[("date", ">=", datetime.utcnow().isoformat())],
            order_by="date",
            limit=5
        )
        
        # Get recent notifications (placeholder)
        notifications = []
        
        return UserDashboardData(
            profile=profile,
            scoreSummary=score_summary,
            recentEvents=recent_events,
            upcomingEvents=upcoming_events,
            notifications=notifications
        )
        
    except Exception as e:
        print(f"Error getting user dashboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/change-password", response_model=APIResponse)
async def change_password(
    password_request: ChangePasswordRequest,
    current_user: dict = Depends(get_current_active_user),
    request: Request = None
):
    """
    Change user's password
    """
    try:
        # Verify current password
        if not current_user.get("hashedPassword"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password not set for this account"
            )
        
        from app.auth import verify_password
        if not verify_password(password_request.current_password, current_user["hashedPassword"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Validate new password strength
        password_validation = validate_password_strength(password_request.new_password)
        if not password_validation["is_valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "New password does not meet security requirements",
                    "errors": password_validation["errors"],
                    "warnings": password_validation["warnings"]
                }
            )
        
        # Hash new password
        new_hashed_password = get_password_hash(password_request.new_password)
        
        # Update password in database
        success = await db.update_document(
            settings.firestore_collection_users,
            current_user["id"],
            {
                "hashedPassword": new_hashed_password,
                "updatedAt": datetime.utcnow().isoformat()
            }
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update password"
            )
        
        # Log activity
        await log_user_activity(
            current_user["id"], 
            "password_changed", 
            request
        )
        
        return APIResponse(
            success=True,
            message="Password changed successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error changing password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/forgot-password", response_model=APIResponse)
async def forgot_password(
    request_data: PasswordResetRequest,
    background_tasks: BackgroundTasks
):
    """
    Request password reset
    """
    try:
        # Find user by email
        user = await db.get_document_by_field(
            settings.firestore_collection_users,
            "email",
            request_data.email.lower()
        )
        
        if not user:
            # Don't reveal if user exists or not
            return APIResponse(
                success=True,
                message="If the email exists, a password reset link has been sent"
            )
        
        # Generate reset token
        reset_token = generate_password_reset_token()
        token_hash = hash_password_reset_token(reset_token)
        
        # Store reset token in database
        await db.update_document(
            settings.firestore_collection_users,
            user["id"],
            {
                "passwordResetToken": token_hash,
                "passwordResetExpires": (datetime.utcnow() + timedelta(hours=1)).isoformat()
            }
        )
        
        # Send reset email in background
        background_tasks.add_task(
            send_password_reset_email,
            user["email"],
            f"{user['firstName']} {user['lastName']}",
            reset_token
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
async def reset_password(
    reset_data: PasswordResetConfirm
):
    """
    Reset password using reset token
    """
    try:
        # Find user by reset token
        users = await db.query_documents(
            settings.firestore_collection_users,
            filters=[("passwordResetToken", "!=", None)]
        )
        
        user = None
        for u in users:
            if verify_password_reset_token(u.get("passwordResetToken", ""), reset_data.token):
                user = u
                break
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Check if token is expired
        reset_expires = datetime.fromisoformat(user.get("passwordResetExpires", "1970-01-01T00:00:00"))
        if datetime.utcnow() > reset_expires:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired"
            )
        
        # Validate new password strength
        password_validation = validate_password_strength(reset_data.newPassword)
        if not password_validation["is_valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "New password does not meet security requirements",
                    "errors": password_validation["errors"],
                    "warnings": password_validation["warnings"]
                }
            )
        
        # Hash new password
        new_hashed_password = get_password_hash(reset_data.newPassword)
        
        # Update password and clear reset token
        success = await db.update_document(
            settings.firestore_collection_users,
            user["id"],
            {
                "hashedPassword": new_hashed_password,
                "passwordResetToken": None,
                "passwordResetExpires": None,
                "updatedAt": datetime.utcnow().isoformat()
            }
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to reset password"
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
async def confirm_email(
    confirmation_data: EmailConfirmationRequest
):
    """
    Confirm user's email address
    """
    try:
        # Find user by confirmation token
        users = await db.query_documents(
            settings.firestore_collection_users,
            filters=[("emailConfirmationToken", "!=", None)]
        )
        
        user = None
        for u in users:
            if u.get("emailConfirmationToken") == confirmation_data.token:
                user = u
                break
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid confirmation token"
            )
        
        # Update user to confirmed
        success = await db.update_document(
            settings.firestore_collection_users,
            user["id"],
            {
                "emailConfirmed": True,
                "emailConfirmationToken": None,
                "emailConfirmationExpires": None,
                "updatedAt": datetime.utcnow().isoformat()
            }
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to confirm email"
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


@router.get("/activity", response_model=List[UserActivityLog])
async def get_user_activity(
    current_user: dict = Depends(get_current_active_user),
    limit: int = 50
):
    """
    Get user's activity log
    """
    try:
        activities = await db.query_documents(
            "user_activity_logs",
            filters=[("user_id", "==", current_user["id"])],
            order_by="timestamp",
            limit=limit
        )
        
        return [
            UserActivityLog(
                id=activity["id"],
                user_id=activity["user_id"],
                action=activity["action"],
                details=activity.get("details"),
                ip_address=activity.get("ip_address"),
                user_agent=activity.get("user_agent"),
                timestamp=datetime.fromisoformat(activity["timestamp"])
            )
            for activity in activities
        ]
        
    except Exception as e:
        print(f"Error getting user activity: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


# Helper functions
async def get_user_score_summary(user_id: str) -> UserScoreSummary:
    """Get user's shooting score summary"""
    try:
        # Get user's scores
        scores = await db.query_documents(
            settings.firestore_collection_scores,
            filters=[("userId", "==", user_id)]
        )
        
        if not scores:
            return UserScoreSummary()
        
        total_matches = len(scores)
        total_score = sum(score.get("score", 0) for score in scores)
        average_score = total_score / total_matches if total_matches > 0 else 0
        total_x_count = sum(score.get("xCount", 0) for score in scores)
        average_x_count = total_x_count / total_matches if total_matches > 0 else 0
        
        # Find personal best
        personal_best = 0
        personal_best_event = None
        personal_best_date = None
        
        for score in scores:
            if score.get("score", 0) > personal_best:
                personal_best = score.get("score", 0)
                personal_best_event = score.get("eventId")
                personal_best_date = datetime.fromisoformat(score["createdAt"]) if score.get("createdAt") else None
        
        # Get unique disciplines
        disciplines = list(set(score.get("discipline", "") for score in scores if score.get("discipline")))
        
        # Get recent scores (last 5)
        recent_scores = sorted(scores, key=lambda x: x.get("createdAt", ""), reverse=True)[:5]
        
        return UserScoreSummary(
            totalMatches=total_matches,
            totalScore=total_score,
            averageScore=round(average_score, 2),
            personalBest=personal_best,
            personalBestEvent=personal_best_event,
            personalBestDate=personal_best_date,
            totalXCount=total_x_count,
            averageXCount=round(average_x_count, 2),
            disciplines=disciplines,
            recentScores=recent_scores
        )
        
    except Exception as e:
        print(f"Error getting user score summary: {e}")
        return UserScoreSummary()


async def send_registration_email(email: str, user_name: str, user_id: str):
    """Send registration confirmation email"""
    try:
        confirmation_token = secrets.token_urlsafe(32)
        confirmation_url = f"http://localhost:3000/confirm-email?token={confirmation_token}"
        
        # Store confirmation token in database
        await db.update_document(
            settings.firestore_collection_users,
            user_id,
            {
                "emailConfirmationToken": confirmation_token,
                "emailConfirmationExpires": (datetime.utcnow() + timedelta(days=7)).isoformat()
            }
        )
        
        # Send confirmation email
        await email_service.send_registration_confirmation(
            to_email=email,
            user_name=user_name,
            confirmation_url=confirmation_url
        )
    except Exception as e:
        print(f"Failed to send registration email: {e}")


async def send_password_reset_email(email: str, user_name: str, reset_token: str):
    """Send password reset email"""
    try:
        reset_url = f"http://localhost:3000/reset-password?token={reset_token}"
        
        await email_service.send_password_reset(
            to_email=email,
            user_name=user_name,
            reset_url=reset_url
        )
    except Exception as e:
        print(f"Failed to send password reset email: {e}") 