from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional, List
from datetime import datetime, timedelta
import secrets
from app.models import (
    EventCreate, EventUpdate, EventResponse, APIResponse, 
    PaginatedResponse, EventStatus
)
from app.auth import get_current_active_user, require_admin
from app.database import db
from app.config import settings
from app.email import email_service

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreate,
    current_user: dict = Depends(require_admin)
):
    """
    Create a new event (Admin only)
    
    - **title**: Event title (3-200 characters)
    - **description**: Event description (optional, max 1000 characters)
    - **date**: Event date and time
    - **location**: Event location (2-200 characters)
    - **type**: Event type (2-100 characters)
    - **maxParticipants**: Maximum number of participants (optional)
    - **status**: Event status (open, full, closed)
    """
    try:
        # Prepare event data
        event_dict = event_data.dict()
        event_dict["currentParticipants"] = 0
        
        # Create event in database
        event_id = await db.create_document(
            settings.firestore_collection_events,
            event_dict
        )
        
        # Get created event
        created_event = await db.get_document(
            settings.firestore_collection_events,
            event_id
        )
        
        return APIResponse(
            success=True,
            message="Event created successfully",
            data={"event": created_event}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/", response_model=PaginatedResponse)
async def get_events(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    type: Optional[str] = Query(None, description="Filter by event type"),
    location: Optional[str] = Query(None, description="Filter by location"),
    status: Optional[EventStatus] = Query(None, description="Filter by status"),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get paginated list of events with optional filters
    """
    try:
        # Build filters
        filters = []
        if type:
            filters.append(("type", "==", type))
        if location:
            filters.append(("location", "==", location))
        if status:
            filters.append(("status", "==", status))
        
        # Get total count
        total = await db.count_documents(
            settings.firestore_collection_events,
            filters
        )
        
        # Calculate pagination
        offset = (page - 1) * size
        total_pages = (total + size - 1) // size
        
        # Get events with pagination
        events = await db.query_documents(
            settings.firestore_collection_events,
            filters=filters,
            order_by="date",
            limit=size
        )
        
        # Apply manual pagination (Firestore doesn't support offset)
        # For production, consider using cursor-based pagination
        events = events[offset:offset + size]
        
        return PaginatedResponse(
            items=events,
            total=total,
            page=page,
            size=size,
            pages=total_pages
        )
        
    except Exception as e:
        print(f"Error getting events: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get a specific event by ID
    """
    try:
        event = await db.get_document(
            settings.firestore_collection_events,
            event_id
        )
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        return EventResponse(**event)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.put("/{event_id}", response_model=APIResponse)
async def update_event(
    event_id: str,
    event_data: EventUpdate,
    current_user: dict = Depends(require_admin)
):
    """
    Update an event (Admin only)
    """
    try:
        # Check if event exists
        existing_event = await db.get_document(
            settings.firestore_collection_events,
            event_id
        )
        
        if not existing_event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Prepare update data (only include non-None values)
        update_data = event_data.dict(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        # Update event
        await db.update_document(
            settings.firestore_collection_events,
            event_id,
            update_data
        )
        
        # Get updated event
        updated_event = await db.get_document(
            settings.firestore_collection_events,
            event_id
        )
        
        return APIResponse(
            success=True,
            message="Event updated successfully",
            data={"event": updated_event}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.delete("/{event_id}", response_model=APIResponse)
async def delete_event(
    event_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Delete an event (Admin only)
    """
    try:
        # Check if event exists
        existing_event = await db.get_document(
            settings.firestore_collection_events,
            event_id
        )
        
        if not existing_event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Delete event
        await db.delete_document(
            settings.firestore_collection_events,
            event_id
        )
        
        return APIResponse(
            success=True,
            message="Event deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/{event_id}/register", response_model=APIResponse)
async def register_for_event(
    event_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Register current user for an event
    """
    try:
        # Check if event exists
        event = await db.get_document(
            settings.firestore_collection_events,
            event_id
        )
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Check if event is open for registration
        if event["status"] != EventStatus.OPEN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event is not open for registration"
            )
        
        # Check if event is full
        if event.get("maxParticipants") and event["currentParticipants"] >= event["maxParticipants"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event is full"
            )
        
        # Check if user is already registered
        # This would require a separate collection for event registrations
        # For now, we'll just increment the participant count
        
        # Update event participant count
        new_participant_count = event["currentParticipants"] + 1
        
        # Check if this makes the event full
        new_status = event["status"]
        if event.get("maxParticipants") and new_participant_count >= event["maxParticipants"]:
            new_status = EventStatus.FULL
        
        # Generate registration ID
        registration_id = secrets.token_urlsafe(16)
        
        await db.update_document(
            settings.firestore_collection_events,
            event_id,
            {
                "currentParticipants": new_participant_count,
                "status": new_status
            }
        )
        
        # Send event registration confirmation email
        try:
            await email_service.send_event_confirmation(
                to_email=current_user["email"],
                user_name=f"{current_user['firstName']} {current_user['lastName']}",
                event_name=event["title"],
                event_date=event["date"],
                event_location=event["location"],
                registration_id=registration_id
            )
        except Exception as e:
            print(f"Failed to send event confirmation email: {e}")
            # Don't fail registration if email fails
        
        return APIResponse(
            success=True,
            message="Successfully registered for event",
            data={"registration_id": registration_id}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error registering for event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.delete("/{event_id}/register", response_model=APIResponse)
async def unregister_from_event(
    event_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Unregister current user from an event
    """
    try:
        # Check if event exists
        event = await db.get_document(
            settings.firestore_collection_events,
            event_id
        )
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Update event participant count
        new_participant_count = max(0, event["currentParticipants"] - 1)
        
        # Update status if event was full and now has space
        new_status = event["status"]
        if event["status"] == EventStatus.FULL and new_participant_count < event.get("maxParticipants", 0):
            new_status = EventStatus.OPEN
        
        await db.update_document(
            settings.firestore_collection_events,
            event_id,
            {
                "currentParticipants": new_participant_count,
                "status": new_status
            }
        )
        
        return APIResponse(
            success=True,
            message="Successfully unregistered from event"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error unregistering from event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/{event_id}/send-reminders", response_model=APIResponse)
async def send_event_reminders(
    event_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Send reminder emails to all registered participants (Admin only)
    """
    try:
        # Check if event exists
        event = await db.get_document(
            settings.firestore_collection_events,
            event_id
        )
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Get all users (in a real implementation, you'd get only registered users)
        # For now, we'll send to all active users
        users = await db.query_documents(
            settings.firestore_collection_users,
            filters=[("isActive", "==", True)]
        )
        
        sent_count = 0
        failed_count = 0
        
        for user in users:
            try:
                await email_service.send_event_reminder(
                    to_email=user["email"],
                    user_name=f"{user['firstName']} {user['lastName']}",
                    event_name=event["title"],
                    event_date=event["date"],
                    event_location=event["location"],
                    event_details=event.get("description", "No additional details available.")
                )
                sent_count += 1
            except Exception as e:
                print(f"Failed to send reminder to {user['email']}: {e}")
                failed_count += 1
        
        return APIResponse(
            success=True,
            message=f"Event reminders sent. Success: {sent_count}, Failed: {failed_count}",
            data={
                "sent_count": sent_count,
                "failed_count": failed_count,
                "total_users": len(users)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error sending event reminders: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        ) 