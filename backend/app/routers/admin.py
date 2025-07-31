from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime, timedelta
from app.auth import require_admin, get_current_active_user
from app.models import (
    UserRole, ScoreStatus, EventStatus, UserResponse, EventResponse, 
    ScoreResponse, APIResponse, PaginatedResponse
)
from app.database import db
from app.config import settings

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])


# ============================================================================
# DASHBOARD STATS ENDPOINTS
# ============================================================================

@router.get("/stats/overview", response_model=dict)
async def get_dashboard_overview(current_user: dict = Depends(require_admin)):
    """Get comprehensive dashboard overview statistics"""
    try:
        # Get all collections
        users = await db.get_collection(settings.firestore_collection_users)
        events = await db.get_collection(settings.firestore_collection_events)
        scores = await db.get_collection(settings.firestore_collection_scores)
        
        # Calculate stats
        total_users = len(users)
        total_events = len(events)
        total_scores = len(scores)
        
        # Active events (not closed)
        active_events = len([e for e in events if e.get("status") != EventStatus.CLOSED])
        
        # Pending scores
        pending_scores = len([s for s in scores if s.get("status") == ScoreStatus.PENDING])
        
        # Recent activity (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_users = len([u for u in users if u.get("createdAt") and u["createdAt"] >= thirty_days_ago])
        recent_scores = len([s for s in scores if s.get("createdAt") and s["createdAt"] >= thirty_days_ago])
        
        # Membership breakdown
        membership_stats = {}
        for user in users:
            membership = user.get("membershipType", "unknown")
            membership_stats[membership] = membership_stats.get(membership, 0) + 1
        
        # Top clubs
        club_stats = {}
        for user in users:
            club = user.get("club", "Unknown")
            club_stats[club] = club_stats.get(club, 0) + 1
        
        top_clubs = sorted(club_stats.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return {
            "success": True,
            "data": {
                "overview": {
                    "totalUsers": total_users,
                    "totalEvents": total_events,
                    "totalScores": total_scores,
                    "activeEvents": active_events,
                    "pendingScores": pending_scores,
                    "recentUsers": recent_users,
                    "recentScores": recent_scores
                },
                "membershipBreakdown": membership_stats,
                "topClubs": [{"club": club, "count": count} for club, count in top_clubs]
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching dashboard stats: {str(e)}"
        )


@router.get("/stats/users", response_model=dict)
async def get_user_statistics(
    current_user: dict = Depends(require_admin),
    period: str = Query("30d", description="Time period: 7d, 30d, 90d, 1y")
):
    """Get detailed user statistics"""
    try:
        users = await db.get_collection(settings.firestore_collection_users)
        
        # Calculate period
        days_map = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}
        days = days_map.get(period, 30)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Filter users by period
        recent_users = [u for u in users if u.get("createdAt") and u["createdAt"] >= start_date]
        
        # Role breakdown
        role_stats = {}
        for user in users:
            role = user.get("role", UserRole.USER)
            role_stats[role] = role_stats.get(role, 0) + 1
        
        # Membership breakdown
        membership_stats = {}
        for user in users:
            membership = user.get("membershipType", "unknown")
            membership_stats[membership] = membership_stats.get(membership, 0) + 1
        
        # Registration trend (daily for the period)
        daily_registrations = {}
        for user in recent_users:
            if user.get("createdAt"):
                date_key = user["createdAt"].strftime("%Y-%m-%d")
                daily_registrations[date_key] = daily_registrations.get(date_key, 0) + 1
        
        return {
            "success": True,
            "data": {
                "totalUsers": len(users),
                "newUsers": len(recent_users),
                "roleBreakdown": role_stats,
                "membershipBreakdown": membership_stats,
                "dailyRegistrations": daily_registrations
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching user statistics: {str(e)}"
        )


@router.get("/stats/events", response_model=dict)
async def get_event_statistics(current_user: dict = Depends(require_admin)):
    """Get detailed event statistics"""
    try:
        events = await db.get_collection(settings.firestore_collection_events)
        scores = await db.get_collection(settings.firestore_collection_scores)
        
        # Event status breakdown
        status_stats = {}
        for event in events:
            status = event.get("status", EventStatus.OPEN)
            status_stats[status] = status_stats.get(status, 0) + 1
        
        # Event type breakdown
        type_stats = {}
        for event in events:
            event_type = event.get("type", "unknown")
            type_stats[event_type] = type_stats.get(event_type, 0) + 1
        
        # Average participation per event
        event_participation = {}
        for event in events:
            event_id = event.get("id")
            event_scores = [s for s in scores if s.get("eventId") == event_id]
            event_participation[event.get("title", "Unknown")] = len(event_scores)
        
        # Upcoming events
        upcoming_events = [e for e in events if e.get("date") and e["date"] > datetime.utcnow()]
        
        return {
            "success": True,
            "data": {
                "totalEvents": len(events),
                "upcomingEvents": len(upcoming_events),
                "statusBreakdown": status_stats,
                "typeBreakdown": type_stats,
                "averageParticipation": sum(event_participation.values()) / len(event_participation) if event_participation else 0,
                "eventParticipation": event_participation
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching event statistics: {str(e)}"
        )


@router.get("/stats/scores", response_model=dict)
async def get_score_statistics(current_user: dict = Depends(require_admin)):
    """Get detailed score statistics"""
    try:
        scores = await db.get_collection(settings.firestore_collection_scores)
        
        # Status breakdown
        status_stats = {}
        for score in scores:
            status = score.get("status", ScoreStatus.PENDING)
            status_stats[status] = status_stats.get(status, 0) + 1
        
        # Discipline breakdown
        discipline_stats = {}
        for score in scores:
            discipline = score.get("discipline", "unknown")
            discipline_stats[discipline] = discipline_stats.get(discipline, 0) + 1
        
        # Score distribution
        score_ranges = {
            "0-100": 0, "101-200": 0, "201-300": 0, 
            "301-400": 0, "401-500": 0, "501-600": 0
        }
        
        for score in scores:
            score_value = score.get("score", 0)
            if score_value <= 100:
                score_ranges["0-100"] += 1
            elif score_value <= 200:
                score_ranges["101-200"] += 1
            elif score_value <= 300:
                score_ranges["201-300"] += 1
            elif score_value <= 400:
                score_ranges["301-400"] += 1
            elif score_value <= 500:
                score_ranges["401-500"] += 1
            else:
                score_ranges["501-600"] += 1
        
        # Average scores by discipline
        discipline_averages = {}
        for discipline in discipline_stats:
            discipline_scores = [s.get("score", 0) for s in scores if s.get("discipline") == discipline]
            if discipline_scores:
                discipline_averages[discipline] = sum(discipline_scores) / len(discipline_scores)
        
        return {
            "success": True,
            "data": {
                "totalScores": len(scores),
                "statusBreakdown": status_stats,
                "disciplineBreakdown": discipline_stats,
                "scoreDistribution": score_ranges,
                "disciplineAverages": discipline_averages
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching score statistics: {str(e)}"
        )


# ============================================================================
# USER MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/users", response_model=PaginatedResponse)
async def get_users(
    current_user: dict = Depends(require_admin),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[UserRole] = Query(None),
    membership_type: Optional[str] = Query(None)
):
    """Get paginated list of users with filtering"""
    try:
        users = await db.get_collection(settings.firestore_collection_users)
        
        # Apply filters
        filtered_users = users
        
        if search:
            search_lower = search.lower()
            filtered_users = [
                u for u in filtered_users 
                if (search_lower in u.get("firstName", "").lower() or
                    search_lower in u.get("lastName", "").lower() or
                    search_lower in u.get("email", "").lower() or
                    search_lower in u.get("club", "").lower())
            ]
        
        if role:
            filtered_users = [u for u in filtered_users if u.get("role") == role]
        
        if membership_type:
            filtered_users = [u for u in filtered_users if u.get("membershipType") == membership_type]
        
        # Pagination
        total = len(filtered_users)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_users = filtered_users[start_idx:end_idx]
        
        # Remove sensitive data
        for user in paginated_users:
            user.pop("hashedPassword", None)
        
        return PaginatedResponse(
            data=paginated_users,
            total=total,
            page=page,
            limit=limit,
            total_pages=(total + limit - 1) // limit
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching users: {str(e)}"
        )


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: dict = Depends(require_admin)):
    """Get detailed user information"""
    try:
        user = await db.get_document(settings.firestore_collection_users, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Remove sensitive data
        user.pop("hashedPassword", None)
        
        return UserResponse(**user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching user: {str(e)}"
        )


@router.put("/users/{user_id}/role", response_model=APIResponse)
async def update_user_role(
    user_id: str,
    role: UserRole,
    current_user: dict = Depends(require_admin)
):
    """Update user role"""
    try:
        user = await db.get_document(settings.firestore_collection_users, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update role
        user["role"] = role
        user["updatedAt"] = datetime.utcnow()
        
        await db.update_document(settings.firestore_collection_users, user_id, user)
        
        return APIResponse(
            success=True,
            message=f"User role updated to {role}",
            data={"userId": user_id, "newRole": role}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating user role: {str(e)}"
        )


@router.delete("/users/{user_id}", response_model=APIResponse)
async def deactivate_user(user_id: str, current_user: dict = Depends(require_admin)):
    """Deactivate a user account"""
    try:
        user = await db.get_document(settings.firestore_collection_users, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prevent admin from deactivating themselves
        if user_id == current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate your own account"
            )
        
        # Deactivate user
        user["isActive"] = False
        user["updatedAt"] = datetime.utcnow()
        
        await db.update_document(settings.firestore_collection_users, user_id, user)
        
        return APIResponse(
            success=True,
            message="User account deactivated",
            data={"userId": user_id}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deactivating user: {str(e)}"
        )


# ============================================================================
# EVENT MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/events", response_model=PaginatedResponse)
async def get_events(
    current_user: dict = Depends(require_admin),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[EventStatus] = Query(None),
    event_type: Optional[str] = Query(None)
):
    """Get paginated list of events with filtering"""
    try:
        events = await db.get_collection(settings.firestore_collection_events)
        
        # Apply filters
        filtered_events = events
        
        if status:
            filtered_events = [e for e in filtered_events if e.get("status") == status]
        
        if event_type:
            filtered_events = [e for e in filtered_events if e.get("type") == event_type]
        
        # Sort by date (newest first)
        filtered_events.sort(key=lambda x: x.get("date", datetime.min), reverse=True)
        
        # Pagination
        total = len(filtered_events)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_events = filtered_events[start_idx:end_idx]
        
        return PaginatedResponse(
            data=paginated_events,
            total=total,
            page=page,
            limit=limit,
            total_pages=(total + limit - 1) // limit
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching events: {str(e)}"
        )


@router.put("/events/{event_id}/status", response_model=APIResponse)
async def update_event_status(
    event_id: str,
    status: EventStatus,
    current_user: dict = Depends(require_admin)
):
    """Update event status"""
    try:
        event = await db.get_document(settings.firestore_collection_events, event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Update status
        event["status"] = status
        event["updatedAt"] = datetime.utcnow()
        
        await db.update_document(settings.firestore_collection_events, event_id, event)
        
        return APIResponse(
            success=True,
            message=f"Event status updated to {status}",
            data={"eventId": event_id, "newStatus": status}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating event status: {str(e)}"
        )


@router.delete("/events/{event_id}", response_model=APIResponse)
async def delete_event(event_id: str, current_user: dict = Depends(require_admin)):
    """Delete an event"""
    try:
        event = await db.get_document(settings.firestore_collection_events, event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Check if event has scores
        scores = await db.get_collection(settings.firestore_collection_scores)
        event_scores = [s for s in scores if s.get("eventId") == event_id]
        
        if event_scores:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete event with existing scores"
            )
        
        # Delete event
        await db.delete_document(settings.firestore_collection_events, event_id)
        
        return APIResponse(
            success=True,
            message="Event deleted successfully",
            data={"eventId": event_id}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting event: {str(e)}"
        )


# ============================================================================
# SCORE MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/scores/pending", response_model=PaginatedResponse)
async def get_pending_scores(
    current_user: dict = Depends(require_admin),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get paginated list of pending scores for approval"""
    try:
        scores = await db.get_collection(settings.firestore_collection_scores)
        pending_scores = [s for s in scores if s.get("status") == ScoreStatus.PENDING]
        
        # Sort by creation date (oldest first for approval queue)
        pending_scores.sort(key=lambda x: x.get("createdAt", datetime.min))
        
        # Pagination
        total = len(pending_scores)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_scores = pending_scores[start_idx:end_idx]
        
        # Add user and event details
        users = await db.get_collection(settings.firestore_collection_users)
        events = await db.get_collection(settings.firestore_collection_events)
        
        for score in paginated_scores:
            # Add user details
            user = next((u for u in users if u.get("id") == score.get("userId")), None)
            if user:
                score["userName"] = f"{user.get('firstName', '')} {user.get('lastName', '')}"
                score["club"] = user.get("club", "")
            
            # Add event details
            event = next((e for e in events if e.get("id") == score.get("eventId")), None)
            if event:
                score["eventTitle"] = event.get("title", "")
                score["eventDate"] = event.get("date")
        
        return PaginatedResponse(
            data=paginated_scores,
            total=total,
            page=page,
            limit=limit,
            total_pages=(total + limit - 1) // limit
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching pending scores: {str(e)}"
        )


@router.put("/scores/{score_id}/approve", response_model=APIResponse)
async def approve_score(
    score_id: str,
    current_user: dict = Depends(require_admin)
):
    """Approve a pending score"""
    try:
        score = await db.get_document(settings.firestore_collection_scores, score_id)
        if not score:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Score not found"
            )
        
        if score.get("status") != ScoreStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Score is not pending approval"
            )
        
        # Update score status
        score["status"] = ScoreStatus.APPROVED
        score["approvedBy"] = current_user["id"]
        score["approvedAt"] = datetime.utcnow()
        score["updatedAt"] = datetime.utcnow()
        
        await db.update_document(settings.firestore_collection_scores, score_id, score)
        
        return APIResponse(
            success=True,
            message="Score approved successfully",
            data={"scoreId": score_id}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error approving score: {str(e)}"
        )


@router.put("/scores/{score_id}/reject", response_model=APIResponse)
async def reject_score(
    score_id: str,
    reason: str,
    current_user: dict = Depends(require_admin)
):
    """Reject a pending score with reason"""
    try:
        score = await db.get_document(settings.firestore_collection_scores, score_id)
        if not score:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Score not found"
            )
        
        if score.get("status") != ScoreStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Score is not pending approval"
            )
        
        # Update score status
        score["status"] = ScoreStatus.REJECTED
        score["rejectedBy"] = current_user["id"]
        score["rejectedAt"] = datetime.utcnow()
        score["rejectionReason"] = reason
        score["updatedAt"] = datetime.utcnow()
        
        await db.update_document(settings.firestore_collection_scores, score_id, score)
        
        return APIResponse(
            success=True,
            message="Score rejected successfully",
            data={"scoreId": score_id, "reason": reason}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error rejecting score: {str(e)}"
        )


@router.get("/scores", response_model=PaginatedResponse)
async def get_all_scores(
    current_user: dict = Depends(require_admin),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[ScoreStatus] = Query(None),
    discipline: Optional[str] = Query(None),
    event_id: Optional[str] = Query(None)
):
    """Get paginated list of all scores with filtering"""
    try:
        scores = await db.get_collection(settings.firestore_collection_scores)
        
        # Apply filters
        filtered_scores = scores
        
        if status:
            filtered_scores = [s for s in filtered_scores if s.get("status") == status]
        
        if discipline:
            filtered_scores = [s for s in filtered_scores if s.get("discipline") == discipline]
        
        if event_id:
            filtered_scores = [s for s in filtered_scores if s.get("eventId") == event_id]
        
        # Sort by creation date (newest first)
        filtered_scores.sort(key=lambda x: x.get("createdAt", datetime.min), reverse=True)
        
        # Pagination
        total = len(filtered_scores)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_scores = filtered_scores[start_idx:end_idx]
        
        # Add user and event details
        users = await db.get_collection(settings.firestore_collection_users)
        events = await db.get_collection(settings.firestore_collection_events)
        
        for score in paginated_scores:
            # Add user details
            user = next((u for u in users if u.get("id") == score.get("userId")), None)
            if user:
                score["userName"] = f"{user.get('firstName', '')} {user.get('lastName', '')}"
                score["club"] = user.get("club", "")
            
            # Add event details
            event = next((e for e in events if e.get("id") == score.get("eventId")), None)
            if event:
                score["eventTitle"] = event.get("title", "")
                score["eventDate"] = event.get("date")
        
        return PaginatedResponse(
            data=paginated_scores,
            total=total,
            page=page,
            limit=limit,
            total_pages=(total + limit - 1) // limit
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching scores: {str(e)}"
        )


# ============================================================================
# SYSTEM ADMIN ENDPOINTS
# ============================================================================

@router.get("/system/health", response_model=dict)
async def get_system_health(current_user: dict = Depends(require_admin)):
    """Get system health and performance metrics"""
    try:
        # Get collection counts
        users = await db.get_collection(settings.firestore_collection_users)
        events = await db.get_collection(settings.firestore_collection_events)
        scores = await db.get_collection(settings.firestore_collection_scores)
        
        # Calculate storage estimates (rough)
        total_storage_estimate = (
            len(users) * 1024 +  # ~1KB per user
            len(events) * 512 +   # ~512B per event
            len(scores) * 256     # ~256B per score
        )
        
        return {
            "success": True,
            "data": {
                "collections": {
                    "users": len(users),
                    "events": len(events),
                    "scores": len(scores)
                },
                "storage": {
                    "estimatedSizeKB": total_storage_estimate,
                    "estimatedSizeMB": round(total_storage_estimate / 1024, 2)
                },
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching system health: {str(e)}"
        )


@router.post("/system/backup", response_model=APIResponse)
async def trigger_backup(current_user: dict = Depends(require_admin)):
    """Trigger a system backup (placeholder for future implementation)"""
    try:
        # This would integrate with your backup service
        # For now, just return success
        return APIResponse(
            success=True,
            message="Backup triggered successfully",
            data={"backupId": f"backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error triggering backup: {str(e)}"
        ) 