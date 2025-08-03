from fastapi import APIRouter, HTTPException, status, Depends, Query, BackgroundTasks
from typing import Optional, List
from datetime import datetime, timedelta
import secrets
import uuid
from app.models import (
    EventCreate, EventUpdate, EventResponse, APIResponse, 
    PaginatedResponse, EventStatus, EventDiscipline, EventSource,
    EventRegistration, EventRegistrationCreate, EventRegistrationResponse,
    EventFilters, EventsResponse, ISSFEventSync, ISSFEventSyncResponse
)
from app.auth import get_current_active_user, require_admin
from app.database import db
from app.config import settings
from app.email import email_service

router = APIRouter(prefix="/events", tags=["Events"])


# Helper functions
async def get_event_by_id(event_id: str) -> dict:
    """Get event by ID with error handling"""
    event = await db.get_document(
        settings.firestore_collection_events,
        event_id
    )
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID '{event_id}' not found"
        )
    return event


async def check_user_registration(event_id: str, user_id: str) -> Optional[dict]:
    """Check if user is already registered for an event"""
    registrations = await db.query_documents(
        settings.firestore_collection_event_registrations,
        [("eventId", "==", event_id), ("userId", "==", user_id)]
    )
    return registrations[0] if registrations else None


async def update_event_participant_count(event_id: str):
    """Update event participant count"""
    registrations = await db.query_documents(
        settings.firestore_collection_event_registrations,
        [("eventId", "==", event_id), ("status", "==", "registered")]
    )
    
    current_spots = len(registrations)
    
    # Get event to check max spots
    event = await get_event_by_id(event_id)
    max_spots = event.get("maxSpots")
    
    # Update event status based on participant count
    new_status = event.get("status")
    if max_spots and current_spots >= max_spots:
        new_status = EventStatus.FULL
    elif current_spots < max_spots:
        new_status = EventStatus.OPEN
    
    # Update event
    await db.update_document(
        settings.firestore_collection_events,
        event_id,
        {
            "currentSpots": current_spots,
            "status": new_status,
            "updatedAt": datetime.utcnow()
        }
    )


# CRUD Endpoints
@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreate,
    current_user: dict = Depends(require_admin)
):
    """
    Create a new event (Admin only)
    
    - **title**: Event title (3-200 characters)
    - **description**: Event description (optional, max 1000 characters)
    - **start**: Event start date and time
    - **end**: Event end date and time
    - **location**: Event location (2-200 characters)
    - **discipline**: Shooting discipline (3P, Prone, Air Rifle, etc.)
    - **category**: Event category (Senior, Junior, etc.)
    - **price**: Event price
    - **maxSpots**: Maximum number of participants (optional)
    - **status**: Event status (upcoming, ongoing, completed, cancelled)
    - **registrationDeadline**: Registration deadline
    """
    try:
        # Prepare event data
        event_dict = event_data.dict()
        event_dict["currentSpots"] = 0
        event_dict["createdAt"] = datetime.utcnow()
        event_dict["updatedAt"] = datetime.utcnow()
        
        # Create event in database
        event_id = await db.create_document(
            settings.firestore_collection_events,
            event_dict
        )
        
        # Get created event
        created_event = await get_event_by_id(event_id)
        
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


@router.get("/", response_model=EventsResponse)
async def get_events(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Page size"),
    discipline: Optional[EventDiscipline] = Query(None, description="Filter by discipline"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[EventStatus] = Query(None, description="Filter by status"),
    source: Optional[EventSource] = Query(None, description="Filter by source"),
    location: Optional[str] = Query(None, description="Filter by location"),
    start_date: Optional[datetime] = Query(None, description="Filter events starting after this date"),
    end_date: Optional[datetime] = Query(None, description="Filter events ending before this date"),
    show_completed: Optional[bool] = Query(False, description="Include completed events"),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get paginated list of events with optional filters
    
    - **page**: Page number (default: 1)
    - **limit**: Number of events per page (default: 50, max: 100)
    - **discipline**: Filter by discipline (3P, Prone, Air Rifle, etc.)
    - **category**: Filter by category (Senior, Junior, etc.)
    - **status**: Filter by status (upcoming, ongoing, completed, cancelled)
    - **source**: Filter by source (satrf, issf)
    - **location**: Filter by location (partial match)
    - **start_date**: Filter events starting after this date
    - **end_date**: Filter events ending before this date
    - **show_completed**: Include completed events (default: false)
    """
    try:
        # Build filters
        filters = []
        if discipline:
            filters.append(("discipline", "==", discipline))
        if category:
            filters.append(("category", "==", category))
        if status:
            filters.append(("status", "==", status))
        if source:
            filters.append(("source", "==", source))
        if location:
            filters.append(("location", "==", location))
        if start_date:
            filters.append(("start", ">=", start_date))
        if end_date:
            filters.append(("end", "<=", end_date))
        if not show_completed:
            filters.append(("status", "!=", EventStatus.COMPLETED))
        
        # Get total count
        total = await db.count_documents(
            settings.firestore_collection_events,
            filters
        )
        
        # Calculate pagination
        offset = (page - 1) * limit
        total_pages = (total + limit - 1) // limit
        has_more = page < total_pages
        
        # Get events with pagination
        events = await db.query_documents(
            settings.firestore_collection_events,
            filters,
            limit=limit,
            offset=offset,
            order_by=[("start", "asc")]
        )
        
        return EventsResponse(
            events=events,
            total=total,
            page=page,
            limit=limit,
            hasMore=has_more
        )
        
    except Exception as e:
        print(f"Error fetching events: {e}")
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
        event = await get_event_by_id(event_id)
        return EventResponse(**event)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching event: {e}")
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
    Update an existing event (Admin only)
    """
    try:
        # Check if event exists
        await get_event_by_id(event_id)
        
        # Prepare update data
        update_data = event_data.dict(exclude_unset=True)
        update_data["updatedAt"] = datetime.utcnow()
        
        # Update event
        await db.update_document(
            settings.firestore_collection_events,
            event_id,
            update_data
        )
        
        # Get updated event
        updated_event = await get_event_by_id(event_id)
        
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
        await get_event_by_id(event_id)
        
        # Delete event
        await db.delete_document(
            settings.firestore_collection_events,
            event_id
        )
        
        # Delete related registrations
        registrations = await db.query_documents(
            settings.firestore_collection_event_registrations,
            [("eventId", "==", event_id)]
        )
        
        for registration in registrations:
            await db.delete_document(
                settings.firestore_collection_event_registrations,
                registration["id"]
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


# Registration Endpoints
@router.post("/{event_id}/register", response_model=APIResponse)
async def register_for_event(
    event_id: str,
    registration_data: EventRegistrationCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Register for an event
    
    - **event_id**: Event ID to register for
    - **paymentMethod**: Payment method (optional)
    - **specialRequirements**: Special requirements (optional)
    """
    try:
        # Get event
        event = await get_event_by_id(event_id)
        
        # Check if registration is open
        if event["status"] not in [EventStatus.OPEN, EventStatus.UPCOMING]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event registration is not open"
            )
        
        # Check registration deadline
        if datetime.utcnow() > event["registrationDeadline"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration deadline has passed"
            )
        
        # Check if user is already registered
        existing_registration = await check_user_registration(event_id, current_user["id"])
        if existing_registration:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User already registered for this event"
            )
        
        # Check if event is full
        if event["maxSpots"] and event["currentSpots"] >= event["maxSpots"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event is full"
            )
        
        # Create registration
        registration_dict = {
            "eventId": event_id,
            "userId": current_user["id"],
            "status": "registered",
            "registeredAt": datetime.utcnow(),
            "paymentStatus": "pending",
            "confirmationNumber": f"REG-{secrets.token_hex(8).upper()}",
            "paymentMethod": registration_data.paymentMethod,
            "specialRequirements": registration_data.specialRequirements
        }
        
        registration_id = await db.create_document(
            settings.firestore_collection_event_registrations,
            registration_dict
        )
        
        # Update event participant count
        await update_event_participant_count(event_id)
        
        # Send confirmation email
        try:
            await email_service.send_event_registration_confirmation(
                user_email=current_user["email"],
                user_name=f"{current_user['firstName']} {current_user['lastName']}",
                event_title=event["title"],
                event_date=event["start"],
                confirmation_number=registration_dict["confirmationNumber"]
            )
        except Exception as e:
            print(f"Error sending confirmation email: {e}")
        
        return APIResponse(
            success=True,
            message="Successfully registered for event",
            data={
                "registrationId": registration_id,
                "confirmationNumber": registration_dict["confirmationNumber"]
            }
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
    Unregister from an event
    """
    try:
        # Check if event exists
        event = await get_event_by_id(event_id)
        
        # Check if user is registered
        registration = await check_user_registration(event_id, current_user["id"])
        if not registration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not registered for this event"
            )
        
        # Delete registration
        await db.delete_document(
            settings.firestore_collection_event_registrations,
            registration["id"]
        )
        
        # Update event participant count
        await update_event_participant_count(event_id)
        
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


@router.get("/registrations", response_model=PaginatedResponse)
async def get_user_registrations(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Page size"),
    status: Optional[str] = Query(None, description="Filter by registration status"),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get user's event registrations
    """
    try:
        # Build filters
        filters = [("userId", "==", current_user["id"])]
        if status:
            filters.append(("status", "==", status))
        
        # Get total count
        total = await db.count_documents(
            settings.firestore_collection_event_registrations,
            filters
        )
        
        # Calculate pagination
        offset = (page - 1) * limit
        total_pages = (total + limit - 1) // limit
        
        # Get registrations with pagination
        registrations = await db.query_documents(
            settings.firestore_collection_event_registrations,
            filters,
            limit=limit,
            offset=offset,
            order_by=[("registeredAt", "desc")]
        )
        
        # Get event details for each registration
        for registration in registrations:
            try:
                event = await get_event_by_id(registration["eventId"])
                registration["event"] = event
            except:
                registration["event"] = None
        
        return PaginatedResponse(
            data=registrations,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
        
    except Exception as e:
        print(f"Error fetching user registrations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


# Specialized Endpoints
@router.get("/upcoming", response_model=List[EventResponse])
async def get_upcoming_events(
    days: int = Query(30, ge=1, le=365, description="Number of days to look ahead"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of events"),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get upcoming events (next N days)
    """
    try:
        start_date = datetime.utcnow()
        end_date = start_date + timedelta(days=days)
        
        filters = [
            ("start", ">=", start_date),
            ("start", "<=", end_date),
            ("status", "in", [EventStatus.UPCOMING, EventStatus.OPEN])
        ]
        
        events = await db.query_documents(
            settings.firestore_collection_events,
            filters,
            limit=limit,
            order_by=[("start", "asc")]
        )
        
        return [EventResponse(**event) for event in events]
        
    except Exception as e:
        print(f"Error fetching upcoming events: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/discipline/{discipline}", response_model=List[EventResponse])
async def get_events_by_discipline(
    discipline: EventDiscipline,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get events by discipline
    """
    try:
        filters = [("discipline", "==", discipline)]
        
        events = await db.query_documents(
            settings.firestore_collection_events,
            filters,
            order_by=[("start", "asc")]
        )
        
        return [EventResponse(**event) for event in events]
        
    except Exception as e:
        print(f"Error fetching events by discipline: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/satrf", response_model=List[EventResponse])
async def get_satrf_events(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get SATRF local events
    """
    try:
        filters = [("source", "==", EventSource.SATRF)]
        
        events = await db.query_documents(
            settings.firestore_collection_events,
            filters,
            order_by=[("start", "asc")]
        )
        
        return [EventResponse(**event) for event in events]
        
    except Exception as e:
        print(f"Error fetching SATRF events: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/issf", response_model=List[EventResponse])
async def get_issf_events(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get ISSF international events
    """
    try:
        filters = [("source", "==", EventSource.ISSF)]
        
        events = await db.query_documents(
            settings.firestore_collection_events,
            filters,
            order_by=[("start", "asc")]
        )
        
        return [EventResponse(**event) for event in events]
        
    except Exception as e:
        print(f"Error fetching ISSF events: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/search", response_model=List[EventResponse])
async def search_events(
    q: str = Query(..., min_length=1, description="Search query"),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Search events by title, description, or location
    """
    try:
        # Note: Firestore doesn't support full-text search natively
        # This is a simple implementation - in production, consider using
        # a search service like Algolia or Elasticsearch
        
        # Get all events and filter in memory (not ideal for large datasets)
        events = await db.query_documents(
            settings.firestore_collection_events,
            [],
            limit=1000  # Limit for performance
        )
        
        # Filter events based on search query
        query_lower = q.lower()
        filtered_events = []
        
        for event in events:
            if (query_lower in event.get("title", "").lower() or
                query_lower in event.get("description", "").lower() or
                query_lower in event.get("location", "").lower()):
                filtered_events.append(event)
        
        return [EventResponse(**event) for event in filtered_events[:50]]  # Limit results
        
    except Exception as e:
        print(f"Error searching events: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


# Admin Endpoints
@router.get("/admin/{event_id}/registrations", response_model=PaginatedResponse)
async def get_event_registrations(
    event_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Page size"),
    current_user: dict = Depends(require_admin)
):
    """
    Get all registrations for a specific event (Admin only)
    """
    try:
        # Check if event exists
        await get_event_by_id(event_id)
        
        # Get registrations
        filters = [("eventId", "==", event_id)]
        
        total = await db.count_documents(
            settings.firestore_collection_event_registrations,
            filters
        )
        
        offset = (page - 1) * limit
        total_pages = (total + limit - 1) // limit
        
        registrations = await db.query_documents(
            settings.firestore_collection_event_registrations,
            filters,
            limit=limit,
            offset=offset,
            order_by=[("registeredAt", "desc")]
        )
        
        # Get user details for each registration
        for registration in registrations:
            try:
                user = await db.get_document(
                    settings.firestore_collection_users,
                    registration["userId"]
                )
                if user:
                    registration["userName"] = f"{user.get('firstName', '')} {user.get('lastName', '')}"
                    registration["userEmail"] = user.get("email", "")
            except:
                registration["userName"] = "Unknown"
                registration["userEmail"] = "Unknown"
        
        return PaginatedResponse(
            data=registrations,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching event registrations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


# ISSF Integration Endpoints
@router.post("/admin/sync-issf", response_model=APIResponse)
async def sync_issf_events(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_admin)
):
    """
    Manually trigger ISSF events synchronization (Admin only)
    """
    try:
        # Add background task for ISSF sync
        background_tasks.add_task(sync_issf_events_background)
        
        return APIResponse(
            success=True,
            message="ISSF events synchronization started"
        )
        
    except Exception as e:
        print(f"Error starting ISSF sync: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/admin/issf-sync-status", response_model=ISSFEventSync)
async def get_issf_sync_status(
    current_user: dict = Depends(require_admin)
):
    """
    Get ISSF synchronization status (Admin only)
    """
    try:
        # Get sync status from database
        sync_status = await db.get_document(
            settings.firestore_collection_system,
            "issf_sync_status"
        )
        
        if not sync_status:
            # Create default sync status
            sync_status = {
                "lastSync": datetime.utcnow() - timedelta(days=1),
                "nextSync": datetime.utcnow() + timedelta(hours=6),
                "syncStatus": "pending",
                "totalISSFEvents": 0,
                "lastError": None
            }
        
        return ISSFEventSync(**sync_status)
        
    except Exception as e:
        print(f"Error fetching ISSF sync status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


# Background task for ISSF sync
async def sync_issf_events_background():
    """
    Background task to sync ISSF events
    """
    try:
        # Update sync status
        await db.update_document(
            settings.firestore_collection_system,
            "issf_sync_status",
            {
                "lastSync": datetime.utcnow(),
                "nextSync": datetime.utcnow() + timedelta(hours=6),
                "syncStatus": "running",
                "lastError": None
            }
        )
        
        # Mock ISSF events data
        mock_issf_events = [
            {
                "title": "ISSF World Cup - Air Rifle",
                "description": "International Shooting Sport Federation World Cup event for Air Rifle discipline",
                "start": datetime.utcnow() + timedelta(days=30),
                "end": datetime.utcnow() + timedelta(days=35),
                "location": "Munich, Germany",
                "discipline": EventDiscipline.AIR_RIFLE,
                "category": "International",
                "price": 0.0,
                "maxSpots": 200,
                "status": EventStatus.UPCOMING,
                "registrationDeadline": datetime.utcnow() + timedelta(days=25),
                "image": "/images/events/issf-world-cup.jpg",
                "requirements": ["Valid passport", "ISSF membership"],
                "schedule": [
                    "Day 1-2: Training and Equipment Check",
                    "Day 3-4: Qualification Rounds",
                    "Day 5: Finals and Medal Ceremony"
                ],
                "contactInfo": {
                    "name": "ISSF Secretariat",
                    "email": "info@issf-sports.org",
                    "phone": "+49 89 544 355 0"
                },
                "isLocal": False,
                "source": EventSource.ISSF,
                "currentSpots": 150,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
        ]
        
        events_added = 0
        events_updated = 0
        events_removed = 0
        
        # Process mock events
        for event_data in mock_issf_events:
            # Check if event already exists
            existing_events = await db.query_documents(
                settings.firestore_collection_events,
                [
                    ("title", "==", event_data["title"]),
                    ("source", "==", EventSource.ISSF)
                ]
            )
            
            if existing_events:
                # Update existing event
                await db.update_document(
                    settings.firestore_collection_events,
                    existing_events[0]["id"],
                    event_data
                )
                events_updated += 1
            else:
                # Create new event
                await db.create_document(
                    settings.firestore_collection_events,
                    event_data
                )
                events_added += 1
        
        # Update sync status
        await db.update_document(
            settings.firestore_collection_system,
            "issf_sync_status",
            {
                "lastSync": datetime.utcnow(),
                "nextSync": datetime.utcnow() + timedelta(hours=6),
                "syncStatus": "success",
                "totalISSFEvents": len(mock_issf_events),
                "lastError": None
            }
        )
        
        print(f"ISSF sync completed: {events_added} added, {events_updated} updated, {events_removed} removed")
        
    except Exception as e:
        print(f"Error in ISSF sync background task: {e}")
        
        # Update sync status with error
        try:
            await db.update_document(
                settings.firestore_collection_system,
                "issf_sync_status",
                {
                    "lastSync": datetime.utcnow(),
                    "nextSync": datetime.utcnow() + timedelta(hours=1),
                    "syncStatus": "error",
                    "lastError": str(e)
                }
            )
        except:
            pass 