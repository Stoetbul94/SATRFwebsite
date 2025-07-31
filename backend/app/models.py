from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    EVENT_SCORER = "event_scorer"


class MembershipType(str, Enum):
    JUNIOR = "junior"
    SENIOR = "senior"
    VETERAN = "veteran"


class EventStatus(str, Enum):
    OPEN = "open"
    FULL = "full"
    CLOSED = "closed"


class ScoreStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


# User Models
class UserBase(BaseModel):
    firstName: str = Field(..., min_length=2, max_length=50, description="User's first name")
    lastName: str = Field(..., min_length=2, max_length=50, description="User's last name")
    email: EmailStr = Field(..., description="User's email address")
    membershipType: MembershipType = Field(..., description="User's membership type")
    club: str = Field(..., min_length=2, max_length=100, description="User's club name")


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="User's password")
    
    @validator('password')
    def validate_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v


class UserUpdate(BaseModel):
    firstName: Optional[str] = Field(None, min_length=2, max_length=50)
    lastName: Optional[str] = Field(None, min_length=2, max_length=50)
    membershipType: Optional[MembershipType] = None
    club: Optional[str] = Field(None, min_length=2, max_length=100)
    profileImageUrl: Optional[str] = Field(None, description="URL to user's profile image")


class UserResponse(UserBase):
    id: str
    role: UserRole = UserRole.USER
    profileImageUrl: Optional[str] = Field(None, description="URL to user's profile image")
    createdAt: datetime
    updatedAt: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Authentication Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


# Event Models
class EventBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200, description="Event title")
    description: Optional[str] = Field(None, max_length=1000, description="Event description")
    date: datetime = Field(..., description="Event date and time")
    location: str = Field(..., min_length=2, max_length=200, description="Event location")
    type: str = Field(..., min_length=2, max_length=100, description="Event type")
    maxParticipants: Optional[int] = Field(None, gt=0, description="Maximum number of participants")
    status: EventStatus = EventStatus.OPEN
    eventImageUrl: Optional[str] = Field(None, description="URL to event image")


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    date: Optional[datetime] = None
    location: Optional[str] = Field(None, min_length=2, max_length=200)
    type: Optional[str] = Field(None, min_length=2, max_length=100)
    maxParticipants: Optional[int] = Field(None, gt=0)
    status: Optional[EventStatus] = None
    eventImageUrl: Optional[str] = Field(None, description="URL to event image")


class EventResponse(EventBase):
    id: str
    currentParticipants: int = 0
    createdAt: datetime
    updatedAt: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Score Models
class ScoreBase(BaseModel):
    eventId: str = Field(..., description="Event ID")
    discipline: str = Field(..., min_length=2, max_length=100, description="Shooting discipline")
    score: int = Field(..., ge=0, le=600, description="Score (0-600)")
    xCount: Optional[int] = Field(None, ge=0, le=60, description="X count (0-60)")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes")
    scoreDocumentUrl: Optional[str] = Field(None, description="URL to the score document")


class ScoreCreate(ScoreBase):
    pass


class ScoreUpdate(BaseModel):
    score: Optional[int] = Field(None, ge=0, le=600)
    xCount: Optional[int] = Field(None, ge=0, le=60)
    notes: Optional[str] = Field(None, max_length=500)
    status: Optional[ScoreStatus] = None
    scoreDocumentUrl: Optional[str] = Field(None, description="URL to the score document")


class ScoreResponse(ScoreBase):
    id: str
    userId: str
    userName: Optional[str] = None
    club: Optional[str] = None
    status: ScoreStatus = ScoreStatus.PENDING
    createdAt: datetime
    updatedAt: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Leaderboard Models
class LeaderboardEntry(BaseModel):
    rank: int
    userId: str
    userName: str
    club: str
    category: str
    bestScore: int
    averageScore: float
    totalScore: int
    totalXCount: int
    eventCount: int
    memberCount: Optional[int] = None
    
    class Config:
        from_attributes = True


class LeaderboardResponse(BaseModel):
    data: List[LeaderboardEntry]
    total: int
    page: int
    limit: int
    total_pages: int
    filters: Optional[dict] = None


# Dashboard Models
class DashboardStats(BaseModel):
    totalMembers: int
    totalEvents: int
    totalScores: int
    activeEvents: int


class DashboardEvent(BaseModel):
    id: str
    title: str
    date: datetime
    location: str
    status: EventStatus


class DashboardScore(BaseModel):
    id: str
    eventId: str
    score: int
    xCount: int
    status: ScoreStatus
    createdAt: datetime


# File Upload Models
class FileUploadResponse(BaseModel):
    filename: str
    file_url: str
    file_size: int
    content_type: str


# Password Reset Models
class PasswordResetRequest(BaseModel):
    email: EmailStr = Field(..., description="User's email address")


class PasswordResetConfirm(BaseModel):
    token: str = Field(..., description="Password reset token")
    newPassword: str = Field(..., min_length=8, description="New password")
    
    @validator('newPassword')
    def validate_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v


# Admin Models
class AdminStats(BaseModel):
    totalUsers: int
    totalEvents: int
    totalScores: int
    activeEvents: int
    pendingScores: int
    recentUsers: int
    recentScores: int


class AdminUserStats(BaseModel):
    totalUsers: int
    newUsers: int
    roleBreakdown: dict
    membershipBreakdown: dict
    dailyRegistrations: dict


class AdminEventStats(BaseModel):
    totalEvents: int
    upcomingEvents: int
    statusBreakdown: dict
    typeBreakdown: dict
    averageParticipation: float
    eventParticipation: dict


class AdminScoreStats(BaseModel):
    totalScores: int
    statusBreakdown: dict
    disciplineBreakdown: dict
    scoreDistribution: dict
    disciplineAverages: dict


class AdminSystemHealth(BaseModel):
    collections: dict
    storage: dict
    status: str
    timestamp: str


# API Response Models
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None


class PaginatedResponse(BaseModel):
    data: List[dict]
    total: int
    page: int
    limit: int
    total_pages: int 