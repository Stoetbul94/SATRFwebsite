from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime
from app.models import ScoreCreate, ScoreResponse, ScoreUpdate, APIResponse, PaginatedResponse
from app.auth import get_current_user
from app.database import db
from app.config import settings
from app.storage import file_storage
import uuid

router = APIRouter(prefix="/scores", tags=["Scores"])


@router.post("/upload", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def upload_score(
    eventId: str = Form(...),
    discipline: str = Form(...),
    score: int = Form(...),
    xCount: Optional[int] = Form(None),
    notes: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
    file: Optional[UploadFile] = File(None)
):
    """
    Upload a new score with optional document
    
    - **eventId**: ID of the event
    - **discipline**: Shooting discipline
    - **score**: Numerical score
    - **xCount**: X-count (optional)
    - **notes**: Additional notes (optional)
    - **file**: Score sheet file (optional)
    """
    try:
        # Validate event exists
        event = await db.get_document(settings.firestore_collection_events, eventId)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Prepare score data
        score_dict = {
            "eventId": eventId,
            "discipline": discipline,
            "score": score,
            "xCount": xCount,
            "notes": notes,
            "userId": current_user["id"],
            "userName": f"{current_user['firstName']} {current_user['lastName']}",
            "club": current_user["club"],
            "status": "pending",  # Default status
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        # Handle file upload if provided
        if file:
            try:
                upload_result = await file_storage.upload_score_document(file, current_user["id"], eventId)
                score_dict["scoreDocumentUrl"] = upload_result["file_url"]
                score_dict["scoreDocumentPath"] = upload_result["storage_path"]
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to upload score document: {str(e)}"
                )
        
        # Create score in database
        score_id = await db.create_document(
            settings.firestore_collection_scores, 
            score_dict
        )
        
        # Get created score
        created_score = await db.get_document(
            settings.firestore_collection_scores, 
            score_id
        )
        
        return APIResponse(
            success=True,
            message="Score uploaded successfully",
            data={
                "score": {
                    "id": created_score["id"],
                    "eventId": created_score["eventId"],
                    "discipline": created_score["discipline"],
                    "score": created_score["score"],
                    "xCount": created_score.get("xCount"),
                    "notes": created_score.get("notes"),
                    "scoreDocumentUrl": created_score.get("scoreDocumentUrl"),
                    "status": created_score["status"],
                    "createdAt": created_score["createdAt"]
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error uploading score: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/my-scores", response_model=PaginatedResponse)
async def get_my_scores(
    current_user: dict = Depends(get_current_user),
    page: int = 1,
    limit: int = 10,
    status: Optional[str] = None
):
    """
    Get current user's scores with pagination
    """
    try:
        # Build query filters
        filters = [("userId", "==", current_user["id"])]
        if status:
            filters.append(("status", "==", status))
        
        # Get scores with pagination
        scores, total = await db.get_documents_paginated(
            settings.firestore_collection_scores,
            filters,
            page=page,
            limit=limit,
            order_by="createdAt",
            order_direction="desc"
        )
        
        # Format response
        score_responses = []
        for score in scores:
            score_responses.append(ScoreResponse(
                id=score["id"],
                eventId=score["eventId"],
                discipline=score["discipline"],
                score=score["score"],
                xCount=score.get("xCount"),
                notes=score.get("notes"),
                status=score["status"],
                createdAt=score["createdAt"],
                updatedAt=score.get("updatedAt")
            ))
        
        return PaginatedResponse(
            data=score_responses,
            total=total,
            page=page,
            limit=limit,
            total_pages=(total + limit - 1) // limit
        )
        
    except Exception as e:
        print(f"Error getting user scores: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/event/{event_id}", response_model=PaginatedResponse)
async def get_event_scores(
    event_id: str,
    page: int = 1,
    limit: int = 50,
    discipline: Optional[str] = None
):
    """
    Get all scores for a specific event
    """
    try:
        # Validate event exists
        event = await db.get_document(settings.firestore_collection_events, event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Build query filters
        filters = [("eventId", "==", event_id)]
        if discipline:
            filters.append(("discipline", "==", discipline))
        
        # Get scores with pagination
        scores, total = await db.get_documents_paginated(
            settings.firestore_collection_scores,
            filters,
            page=page,
            limit=limit,
            order_by="score",
            order_direction="desc"
        )
        
        # Format response
        score_responses = []
        for score in scores:
            score_responses.append(ScoreResponse(
                id=score["id"],
                eventId=score["eventId"],
                discipline=score["discipline"],
                score=score["score"],
                xCount=score.get("xCount"),
                notes=score.get("notes"),
                status=score["status"],
                userName=score.get("userName"),
                club=score.get("club"),
                createdAt=score["createdAt"],
                updatedAt=score.get("updatedAt")
            ))
        
        return PaginatedResponse(
            data=score_responses,
            total=total,
            page=page,
            limit=limit,
            total_pages=(total + limit - 1) // limit
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting event scores: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.put("/{score_id}", response_model=APIResponse)
async def update_score(
    score_id: str,
    score_update: ScoreUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a score (only by the score owner or admin)
    """
    try:
        # Get score
        score = await db.get_document(settings.firestore_collection_scores, score_id)
        if not score:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Score not found"
            )
        
        # Check permissions (owner or admin)
        if score["userId"] != current_user["id"] and current_user.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this score"
            )
        
        # Update score
        update_data = score_update.dict(exclude_unset=True)
        update_data["updatedAt"] = datetime.utcnow()
        
        await db.update_document(
            settings.firestore_collection_scores,
            score_id,
            update_data
        )
        
        return APIResponse(
            success=True,
            message="Score updated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating score: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.delete("/{score_id}", response_model=APIResponse)
async def delete_score(
    score_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a score (only by the score owner or admin)
    """
    try:
        # Get score
        score = await db.get_document(settings.firestore_collection_scores, score_id)
        if not score:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Score not found"
            )
        
        # Check permissions (owner or admin)
        if score["userId"] != current_user["id"] and current_user.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this score"
            )
        
        # Delete score
        await db.delete_document(settings.firestore_collection_scores, score_id)
        
        return APIResponse(
            success=True,
            message="Score deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting score: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.put("/{score_id}/approve", response_model=APIResponse)
async def approve_score(
    score_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Approve a score (admin only)
    """
    try:
        # Check if user is admin
        if current_user.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        # Get score
        score = await db.get_document(settings.firestore_collection_scores, score_id)
        if not score:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Score not found"
            )
        
        # Update status to approved
        await db.update_document(
            settings.firestore_collection_scores,
            score_id,
            {
                "status": "approved",
                "approvedBy": current_user["id"],
                "approvedAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
        )
        
        return APIResponse(
            success=True,
            message="Score approved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error approving score: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.put("/{score_id}/reject", response_model=APIResponse)
async def reject_score(
    score_id: str,
    reason: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Reject a score (admin only)
    """
    try:
        # Check if user is admin
        if current_user.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        # Get score
        score = await db.get_document(settings.firestore_collection_scores, score_id)
        if not score:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Score not found"
            )
        
        # Update status to rejected
        await db.update_document(
            settings.firestore_collection_scores,
            score_id,
            {
                "status": "rejected",
                "rejectedBy": current_user["id"],
                "rejectedAt": datetime.utcnow(),
                "rejectionReason": reason,
                "updatedAt": datetime.utcnow()
            }
        )
        
        return APIResponse(
            success=True,
            message="Score rejected successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error rejecting score: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        ) 