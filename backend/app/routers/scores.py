from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime
from app.models import (
    ScoreCreate, ScoreResponse, ScoreUpdate, APIResponse, PaginatedResponse,
    ISSFScoreImportResponse, ISSFScoreImportResult, ISSFScoreImportError, ISSFScoreRow
)
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


@router.post("/import-issf", response_model=ISSFScoreImportResponse, status_code=status.HTTP_201_CREATED)
async def import_issf_scores(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Import ISSF match scores from Excel/CSV file (admin only)
    
    Expected columns:
    Event Name, Match Number, Shooter Name, Shooter ID, Club, Division/Class, 
    Veteran, Series 1, Series 2, Series 3, Series 4, Series 5, Series 6, Total, Place
    """
    try:
        # Check if user is admin
        if current_user.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        # Validate file type
        if not file.filename.lower().endswith(('.xlsx', '.csv')):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be .xlsx or .csv format"
            )
        
        # Import required libraries
        import pandas as pd
        import io
        
        # Read file content
        content = await file.read()
        
        # Parse file based on type
        if file.filename.lower().endswith('.xlsx'):
            df = pd.read_excel(io.BytesIO(content))
        else:  # CSV
            df = pd.read_csv(io.BytesIO(content))
        
        # Validate required columns
        required_columns = [
            'Event Name', 'Match Number', 'Shooter Name', 'Shooter ID', 'Club', 
            'Division/Class', 'Veteran', 'Series 1', 'Series 2', 'Series 3', 
            'Series 4', 'Series 5', 'Series 6', 'Total', 'Place'
        ]
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        # Process rows
        records_added = 0
        records_failed = 0
        errors = []
        
        for index, row in df.iterrows():
            row_number = index + 2  # +2 because Excel/CSV is 1-indexed and we have header
            
            try:
                # Convert row to dict and handle NaN values
                row_dict = {}
                for col in required_columns:
                    value = row[col]
                    if pd.isna(value):
                        row_dict[col.lower().replace(' ', '_').replace('/', '_')] = None
                    else:
                        row_dict[col.lower().replace(' ', '_').replace('/', '_')] = value
                
                # Validate and create ISSFScoreRow
                score_row = ISSFScoreRow(**row_dict)
                
                # Create score record in database
                score_data = {
                    "eventName": score_row.event_name,
                    "matchNumber": score_row.match_number,
                    "shooterName": score_row.shooter_name,
                    "shooterId": score_row.shooter_id,
                    "club": score_row.club,
                    "divisionClass": score_row.division_class,
                    "veteran": score_row.veteran,
                    "series1": score_row.series_1,
                    "series2": score_row.series_2,
                    "series3": score_row.series_3,
                    "series4": score_row.series_4,
                    "series5": score_row.series_5,
                    "series6": score_row.series_6,
                    "total": score_row.total,
                    "place": score_row.place,
                    "importedBy": current_user["id"],
                    "importedAt": datetime.utcnow(),
                    "status": "approved",  # Auto-approve imported scores
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                }
                
                # Store in database
                await db.create_document(
                    settings.firestore_collection_scores,
                    score_data
                )
                
                records_added += 1
                
            except Exception as e:
                records_failed += 1
                
                # Extract field name from validation error
                field_name = "unknown"
                if "field" in str(e):
                    # Try to extract field name from Pydantic error
                    error_str = str(e)
                    if "field required" in error_str:
                        field_match = error_str.split("field required")[0].split()[-1]
                        field_name = field_match
                    elif "ensure this value" in error_str:
                        field_match = error_str.split("ensure this value")[0].split()[-1]
                        field_name = field_match
                
                errors.append(ISSFScoreImportError(
                    row_number=row_number,
                    field=field_name,
                    error=str(e),
                    data=row.to_dict()
                ))
        
        # Generate summary
        summary = f"Import completed: {records_added} records added, {records_failed} records failed"
        if errors:
            summary += f". {len(errors)} validation errors occurred."
        
        return ISSFScoreImportResponse(
            success=True,
            message="ISSF scores import completed",
            data=ISSFScoreImportResult(
                records_added=records_added,
                records_failed=records_failed,
                errors=errors,
                summary=summary
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error importing ISSF scores: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        ) 