from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import List, Optional
from datetime import datetime

from app.auth import get_current_user, get_current_user_optional
from app.models import UserResponse, UserRole, APIResponse
from app.storage import file_storage
from app.database import db
from app.config import settings

router = APIRouter(tags=["File Storage"])


@router.post("/upload/profile-image", response_model=APIResponse)
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Upload a profile image for the authenticated user
    
    - **file**: Image file (JPEG, PNG, GIF)
    - **Authentication required**: Yes
    - **Role restrictions**: None (users can upload their own profile images)
    """
    try:
        # Upload the file
        upload_result = await file_storage.upload_profile_image(file, current_user.id)
        
        # Update user document in Firestore with new profile image URL
        user_ref = db.collection(settings.firestore_collection_users).document(current_user.id)
        user_ref.update({
            "profileImageUrl": upload_result["file_url"],
            "updatedAt": datetime.now()
        })
        
        return APIResponse(
            success=True,
            message="Profile image uploaded successfully",
            data=upload_result
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload profile image: {str(e)}"
        )


@router.post("/upload/score-document", response_model=APIResponse)
async def upload_score_document(
    file: UploadFile = File(...),
    event_id: str = Form(...),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Upload a score document for verification
    
    - **file**: Document file (PDF, JPEG, PNG)
    - **event_id**: ID of the event this score document is for
    - **Authentication required**: Yes
    - **Role restrictions**: None (users can upload their own score documents)
    """
    try:
        # Upload the file
        upload_result = await file_storage.upload_score_document(file, current_user.id, event_id)
        
        return APIResponse(
            success=True,
            message="Score document uploaded successfully",
            data=upload_result
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload score document: {str(e)}"
        )


@router.post("/upload/event-image", response_model=APIResponse)
async def upload_event_image(
    file: UploadFile = File(...),
    event_id: str = Form(...),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Upload an event image
    
    - **file**: Image file (JPEG, PNG, GIF)
    - **event_id**: ID of the event this image is for
    - **Authentication required**: Yes
    - **Role restrictions**: Admin or Event Scorer only
    """
    # Check if user has permission to upload event images
    if current_user.role not in [UserRole.ADMIN, UserRole.EVENT_SCORER]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions. Only admins and event scorers can upload event images."
        )
    
    try:
        # Upload the file
        upload_result = await file_storage.upload_event_image(file, event_id)
        
        # Update event document in Firestore with new image URL
        event_ref = db.collection(settings.firestore_collection_events).document(event_id)
        event_ref.update({
            "eventImageUrl": upload_result["file_url"],
            "updatedAt": datetime.now()
        })
        
        return APIResponse(
            success=True,
            message="Event image uploaded successfully",
            data=upload_result
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload event image: {str(e)}"
        )


@router.get("/files/user/{user_id}", response_model=APIResponse)
async def list_user_files(
    user_id: str,
    file_type: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    List all files for a specific user
    
    - **user_id**: ID of the user whose files to list
    - **file_type**: Optional filter for file type (profile_image, score_document)
    - **Authentication required**: Yes
    - **Role restrictions**: Users can only see their own files, admins can see all files
    """
    # Check if user has permission to view these files
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions. You can only view your own files."
        )
    
    try:
        files = file_storage.list_user_files(user_id, file_type)
        
        return APIResponse(
            success=True,
            message=f"Retrieved {len(files)} files for user {user_id}",
            data={"files": files, "count": len(files)}
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list user files: {str(e)}"
        )


@router.get("/files/info/{storage_path:path}", response_model=APIResponse)
async def get_file_info(
    storage_path: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get information about a specific file
    
    - **storage_path**: Path to the file in storage
    - **Authentication required**: Yes
    - **Role restrictions**: Users can only see their own files, admins can see all files
    """
    try:
        file_info = file_storage.get_file_info(storage_path)
        
        if not file_info:
            raise HTTPException(
                status_code=404,
                detail="File not found"
            )
        
        # Check if user has permission to view this file
        if current_user.role != UserRole.ADMIN:
            # For non-admins, check if the file belongs to them
            if not storage_path.startswith(f"{current_user.id}_"):
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions to view this file."
                )
        
        return APIResponse(
            success=True,
            message="File information retrieved successfully",
            data=file_info
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get file info: {str(e)}"
        )


@router.delete("/files/{storage_path:path}", response_model=APIResponse)
async def delete_file(
    storage_path: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Delete a file from storage
    
    - **storage_path**: Path to the file in storage
    - **Authentication required**: Yes
    - **Role restrictions**: Users can only delete their own files, admins can delete any file
    """
    try:
        # Check if user has permission to delete this file
        if current_user.role != UserRole.ADMIN:
            # For non-admins, check if the file belongs to them
            if not storage_path.startswith(f"{current_user.id}_"):
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions to delete this file."
                )
        
        success = file_storage.delete_file(storage_path)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail="File not found or could not be deleted"
            )
        
        return APIResponse(
            success=True,
            message="File deleted successfully"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete file: {str(e)}"
        )


@router.get("/files/download/{storage_path:path}", response_model=APIResponse)
async def generate_download_url(
    storage_path: str,
    expires_in: int = 3600,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Generate a signed download URL for a file
    
    - **storage_path**: Path to the file in storage
    - **expires_in**: URL expiration time in seconds (default: 1 hour)
    - **Authentication required**: Yes
    - **Role restrictions**: Users can only download their own files, admins can download any file
    """
    try:
        # Check if user has permission to download this file
        if current_user.role != UserRole.ADMIN:
            # For non-admins, check if the file belongs to them
            if not storage_path.startswith(f"{current_user.id}_"):
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions to download this file."
                )
        
        download_url = file_storage.generate_download_url(storage_path, expires_in)
        
        if not download_url:
            raise HTTPException(
                status_code=404,
                detail="File not found or could not generate download URL"
            )
        
        return APIResponse(
            success=True,
            message="Download URL generated successfully",
            data={
                "download_url": download_url,
                "expires_in": expires_in,
                "expires_at": datetime.now().timestamp() + expires_in
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate download URL: {str(e)}"
        ) 