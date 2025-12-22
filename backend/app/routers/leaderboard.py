from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime, timedelta
from app.models import LeaderboardEntry, LeaderboardResponse, APIResponse, PaginatedResponse
from app.auth import get_current_user
from app.database import db
from app.config import settings

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


@router.get("/overall", response_model=LeaderboardResponse)
async def get_overall_leaderboard(
    discipline: Optional[str] = Query(None, description="Filter by discipline"),
    category: Optional[str] = Query(None, description="Filter by category (junior, senior, veteran)"),
    time_period: Optional[str] = Query("all", description="Time period: all, year, month, week"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Results per page")
):
    """
    Get overall leaderboard rankings
    
    - **discipline**: Filter by shooting discipline
    - **category**: Filter by age category
    - **time_period**: Time period for rankings (all, year, month, week)
    - **page**: Page number for pagination
    - **limit**: Number of results per page
    """
    try:
        # Calculate date filter based on time period
        date_filter = None
        if time_period != "all":
            now = datetime.utcnow()
            if time_period == "year":
                date_filter = now - timedelta(days=365)
            elif time_period == "month":
                date_filter = now - timedelta(days=30)
            elif time_period == "week":
                date_filter = now - timedelta(days=7)
        
        # Build query filters
        filters = [("status", "==", "approved")]
        if date_filter:
            filters.append(("createdAt", ">=", date_filter))
        
        # Get all approved scores
        scores, total = await db.get_documents_paginated(
            settings.firestore_collection_scores,
            filters,
            page=1,
            limit=1000,  # Get all scores for processing
            order_by="score",
            order_direction="desc"
        )
        
        # Process scores to create leaderboard
        user_stats = {}
        
        for score in scores:
            user_id = score["userId"]
            
            # Filter by discipline if specified
            if discipline and score["discipline"] != discipline:
                continue
            
            # Get user details for category filtering
            user = await db.get_document(settings.firestore_collection_users, user_id)
            if not user:
                continue
            
            # Filter by category if specified
            if category and user.get("membershipType") != category:
                continue
            
            # Initialize user stats if not exists
            if user_id not in user_stats:
                user_stats[user_id] = {
                    "userId": user_id,
                    "userName": score.get("userName", f"{user.get('firstName', '')} {user.get('lastName', '')}"),
                    "club": score.get("club", user.get("club", "")),
                    "category": user.get("membershipType", "senior"),
                    "scores": [],
                    "totalScore": 0,
                    "averageScore": 0,
                    "bestScore": 0,
                    "totalXCount": 0,
                    "eventCount": 0
                }
            
            # Add score to user stats
            user_stats[user_id]["scores"].append(score["score"])
            user_stats[user_id]["totalScore"] += score["score"]
            user_stats[user_id]["totalXCount"] += score.get("xCount", 0)
            user_stats[user_id]["eventCount"] += 1
            
            # Update best score
            if score["score"] > user_stats[user_id]["bestScore"]:
                user_stats[user_id]["bestScore"] = score["score"]
        
        # Calculate averages and create leaderboard entries
        leaderboard_entries = []
        for user_id, stats in user_stats.items():
            if stats["eventCount"] >= 3:  # Minimum 3 events for ranking
                stats["averageScore"] = round(stats["totalScore"] / stats["eventCount"], 1)
                leaderboard_entries.append(LeaderboardEntry(
                    rank=0,  # Will be set after sorting
                    userId=stats["userId"],
                    userName=stats["userName"],
                    club=stats["club"],
                    category=stats["category"],
                    bestScore=stats["bestScore"],
                    averageScore=stats["averageScore"],
                    totalScore=stats["totalScore"],
                    totalXCount=stats["totalXCount"],
                    eventCount=stats["eventCount"]
                ))
        
        # Sort by best score (primary) and average score (secondary)
        leaderboard_entries.sort(key=lambda x: (x.bestScore, x.averageScore), reverse=True)
        
        # Assign ranks
        for i, entry in enumerate(leaderboard_entries):
            entry.rank = i + 1
        
        # Apply pagination
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_entries = leaderboard_entries[start_idx:end_idx]
        
        return LeaderboardResponse(
            data=paginated_entries,
            total=len(leaderboard_entries),
            page=page,
            limit=limit,
            total_pages=(len(leaderboard_entries) + limit - 1) // limit,
            filters={
                "discipline": discipline,
                "category": category,
                "time_period": time_period
            }
        )
        
    except Exception as e:
        print(f"Error getting leaderboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/event/{event_id}", response_model=LeaderboardResponse)
async def get_event_leaderboard(
    event_id: str,
    discipline: Optional[str] = Query(None, description="Filter by discipline"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Results per page")
):
    """
    Get leaderboard for a specific event
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
        filters = [
            ("eventId", "==", event_id),
            ("status", "==", "approved")
        ]
        if discipline:
            filters.append(("discipline", "==", discipline))
        
        # Get event scores
        scores, total = await db.get_documents_paginated(
            settings.firestore_collection_scores,
            filters,
            page=1,
            limit=1000,  # Get all scores for the event
            order_by="score",
            order_direction="desc"
        )
        
        # Create leaderboard entries
        leaderboard_entries = []
        for i, score in enumerate(scores):
            # Get user details
            user = await db.get_document(settings.firestore_collection_users, score["userId"])
            
            entry = LeaderboardEntry(
                rank=i + 1,
                userId=score["userId"],
                userName=score.get("userName", f"{user.get('firstName', '')} {user.get('lastName', '')}" if user else "Unknown"),
                club=score.get("club", user.get("club", "") if user else ""),
                category=user.get("membershipType", "senior") if user else "senior",
                bestScore=score["score"],
                averageScore=score["score"],
                totalScore=score["score"],
                totalXCount=score.get("xCount", 0),
                eventCount=1
            )
            leaderboard_entries.append(entry)
        
        # Apply pagination
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_entries = leaderboard_entries[start_idx:end_idx]
        
        return LeaderboardResponse(
            data=paginated_entries,
            total=len(leaderboard_entries),
            page=page,
            limit=limit,
            total_pages=(len(leaderboard_entries) + limit - 1) // limit,
            filters={
                "event_id": event_id,
                "discipline": discipline
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting event leaderboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/club", response_model=LeaderboardResponse)
async def get_club_leaderboard(
    time_period: Optional[str] = Query("all", description="Time period: all, year, month, week"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Results per page")
):
    """
    Get club leaderboard rankings
    """
    try:
        # Calculate date filter based on time period
        date_filter = None
        if time_period != "all":
            now = datetime.utcnow()
            if time_period == "year":
                date_filter = now - timedelta(days=365)
            elif time_period == "month":
                date_filter = now - timedelta(days=30)
            elif time_period == "week":
                date_filter = now - timedelta(days=7)
        
        # Build query filters
        filters = [("status", "==", "approved")]
        if date_filter:
            filters.append(("createdAt", ">=", date_filter))
        
        # Get all approved scores
        scores, total = await db.get_documents_paginated(
            settings.firestore_collection_scores,
            filters,
            page=1,
            limit=1000,
            order_by="score",
            order_direction="desc"
        )
        
        # Process scores to create club leaderboard
        club_stats = {}
        
        for score in scores:
            club = score.get("club", "Unknown")
            
            # Initialize club stats if not exists
            if club not in club_stats:
                club_stats[club] = {
                    "clubName": club,
                    "totalScore": 0,
                    "averageScore": 0,
                    "bestScore": 0,
                    "totalXCount": 0,
                    "memberCount": 0,
                    "eventCount": 0,
                    "members": set()
                }
            
            # Add score to club stats
            club_stats[club]["totalScore"] += score["score"]
            club_stats[club]["totalXCount"] += score.get("xCount", 0)
            club_stats[club]["eventCount"] += 1
            club_stats[club]["members"].add(score["userId"])
            
            # Update best score
            if score["score"] > club_stats[club]["bestScore"]:
                club_stats[club]["bestScore"] = score["score"]
        
        # Calculate averages and create leaderboard entries
        leaderboard_entries = []
        for club, stats in club_stats.items():
            if len(stats["members"]) >= 2:  # Minimum 2 members for club ranking
                stats["memberCount"] = len(stats["members"])
                stats["averageScore"] = round(stats["totalScore"] / stats["eventCount"], 1)
                
                leaderboard_entries.append(LeaderboardEntry(
                    rank=0,  # Will be set after sorting
                    userId="",  # Not applicable for club rankings
                    userName=stats["clubName"],
                    club=stats["clubName"],
                    category="club",
                    bestScore=stats["bestScore"],
                    averageScore=stats["averageScore"],
                    totalScore=stats["totalScore"],
                    totalXCount=stats["totalXCount"],
                    eventCount=stats["eventCount"],
                    memberCount=stats["memberCount"]
                ))
        
        # Sort by best score (primary) and average score (secondary)
        leaderboard_entries.sort(key=lambda x: (x.bestScore, x.averageScore), reverse=True)
        
        # Assign ranks
        for i, entry in enumerate(leaderboard_entries):
            entry.rank = i + 1
        
        # Apply pagination
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_entries = leaderboard_entries[start_idx:end_idx]
        
        return LeaderboardResponse(
            data=paginated_entries,
            total=len(leaderboard_entries),
            page=page,
            limit=limit,
            total_pages=(len(leaderboard_entries) + limit - 1) // limit,
            filters={
                "time_period": time_period
            }
        )
        
    except Exception as e:
        print(f"Error getting club leaderboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/statistics", response_model=APIResponse)
async def get_leaderboard_statistics(
    current_user: dict = Depends(get_current_user)
):
    """
    Get leaderboard statistics for the current user
    """
    try:
        # Get user's scores
        user_scores, total = await db.get_documents_paginated(
            settings.firestore_collection_scores,
            [("userId", "==", current_user["id"]), ("status", "==", "approved")],
            page=1,
            limit=1000,
            order_by="score",
            order_direction="desc"
        )
        
        if not user_scores:
            return APIResponse(
                success=True,
                data={
                    "statistics": {
                        "totalScores": 0,
                        "bestScore": 0,
                        "averageScore": 0,
                        "totalXCount": 0,
                        "currentRank": None,
                        "clubRank": None,
                        "categoryRank": None
                    }
                }
            )
        
        # Calculate user statistics
        total_score = sum(score["score"] for score in user_scores)
        best_score = max(score["score"] for score in user_scores)
        average_score = round(total_score / len(user_scores), 1)
        total_x_count = sum(score.get("xCount", 0) for score in user_scores)
        
        # Get overall rankings to find user's position
        overall_leaderboard = await get_overall_leaderboard(
            page=1,
            limit=1000
        )
        
        # Find user's rank
        current_rank = None
        for entry in overall_leaderboard.data:
            if entry.userId == current_user["id"]:
                current_rank = entry.rank
                break
        
        # Get category rankings
        category_leaderboard = await get_overall_leaderboard(
            category=current_user.get("membershipType", "senior"),
            page=1,
            limit=1000
        )
        
        category_rank = None
        for entry in category_leaderboard.data:
            if entry.userId == current_user["id"]:
                category_rank = entry.rank
                break
        
        # Get club rankings
        club_leaderboard = await get_club_leaderboard(
            page=1,
            limit=1000
        )
        
        club_rank = None
        for entry in club_leaderboard.data:
            if entry.club == current_user.get("club", ""):
                club_rank = entry.rank
                break
        
        return APIResponse(
            success=True,
            data={
                "statistics": {
                    "totalScores": len(user_scores),
                    "bestScore": best_score,
                    "averageScore": average_score,
                    "totalXCount": total_x_count,
                    "currentRank": current_rank,
                    "clubRank": club_rank,
                    "categoryRank": category_rank
                }
            }
        )
        
    except Exception as e:
        print(f"Error getting user statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        ) 