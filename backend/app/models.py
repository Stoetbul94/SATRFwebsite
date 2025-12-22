from pydantic import BaseModel, EmailStr, Field, validator, field_validator
from typing import Optional, List, Union
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
    UPCOMING = "upcoming"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class EventDiscipline(str, Enum):
    THREE_POSITION = "3P"
    PRONE = "Prone"
    AIR_RIFLE = "Air Rifle"
    AIR_PISTOL = "Air Pistol"
    TARGET_RIFLE = "Target Rifle"


class EventSource(str, Enum):
    SATRF = "satrf"
    ISSF = "issf"


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
    start: datetime = Field(..., description="Event start date and time")
    end: datetime = Field(..., description="Event end date and time")
    location: str = Field(..., min_length=2, max_length=200, description="Event location")
    discipline: EventDiscipline = Field(..., description="Shooting discipline")
    category: str = Field(..., min_length=2, max_length=100, description="Event category (Senior, Junior, etc.)")
    price: float = Field(0.0, ge=0.0, description="Event price")
    maxSpots: Optional[int] = Field(None, gt=0, description="Maximum number of participants")
    status: EventStatus = EventStatus.UPCOMING
    registrationDeadline: datetime = Field(..., description="Registration deadline")
    image: Optional[str] = Field(None, description="URL to event image")
    requirements: Optional[List[str]] = Field(None, description="Event requirements")
    schedule: Optional[List[str]] = Field(None, description="Event schedule")
    contactInfo: Optional[dict] = Field(None, description="Contact information")
    isLocal: bool = Field(True, description="Whether this is a local SATRF event")
    source: EventSource = Field(EventSource.SATRF, description="Event source (SATRF or ISSF)")
    
    @validator('end')
    def validate_end_after_start(cls, v, values):
        if 'start' in values and v <= values['start']:
            raise ValueError('End time must be after start time')
        return v
    
    @validator('registrationDeadline')
    def validate_registration_deadline(cls, v, values):
        if 'start' in values and v >= values['start']:
            raise ValueError('Registration deadline must be before event start time')
        return v


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    location: Optional[str] = Field(None, min_length=2, max_length=200)
    discipline: Optional[EventDiscipline] = None
    category: Optional[str] = Field(None, min_length=2, max_length=100)
    price: Optional[float] = Field(None, ge=0.0)
    maxSpots: Optional[int] = Field(None, gt=0)
    status: Optional[EventStatus] = None
    registrationDeadline: Optional[datetime] = None
    image: Optional[str] = Field(None, description="URL to event image")
    requirements: Optional[List[str]] = None
    schedule: Optional[List[str]] = None
    contactInfo: Optional[dict] = None
    isLocal: Optional[bool] = None
    source: Optional[EventSource] = None


class EventResponse(EventBase):
    id: str
    currentSpots: int = 0
    createdAt: datetime
    updatedAt: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class EventRegistration(BaseModel):
    eventId: str = Field(..., description="Event ID")
    userId: str = Field(..., description="User ID")
    status: str = Field("registered", description="Registration status")
    registeredAt: datetime = Field(default_factory=datetime.utcnow)
    paymentStatus: Optional[str] = Field("pending", description="Payment status")
    confirmationNumber: Optional[str] = Field(None, description="Confirmation number")
    
    class Config:
        from_attributes = True


class EventRegistrationCreate(BaseModel):
    eventId: str = Field(..., description="Event ID")
    paymentMethod: Optional[str] = Field(None, description="Payment method")
    specialRequirements: Optional[str] = Field(None, description="Special requirements")


class EventRegistrationResponse(BaseModel):
    eventId: str
    userId: str
    status: str
    registeredAt: datetime
    paymentStatus: str
    confirmationNumber: Optional[str] = None
    event: Optional[EventResponse] = None


class EventFilters(BaseModel):
    discipline: Optional[EventDiscipline] = None
    category: Optional[str] = None
    status: Optional[EventStatus] = None
    source: Optional[EventSource] = None
    location: Optional[str] = None
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None
    showCompleted: Optional[bool] = False


class EventsResponse(BaseModel):
    events: List[EventResponse]
    total: int
    page: int
    limit: int
    hasMore: bool


class ISSFEventSync(BaseModel):
    lastSync: datetime
    nextSync: datetime
    syncStatus: str
    totalISSFEvents: int
    lastError: Optional[str] = None


class ISSFEventSyncResponse(BaseModel):
    message: str
    eventsAdded: int
    eventsUpdated: int
    eventsRemoved: int


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


# ISSF Score Import Models
class ISSFEventType(str, Enum):
    PRONE_MATCH_1 = "Prone Match 1"
    PRONE_MATCH_2 = "Prone Match 2"
    THREE_POSITION = "3P"
    AIR_RIFLE = "Air Rifle"


class ISSFScoreRow(BaseModel):
    event_name: str = Field(..., description="Event name")
    match_number: int = Field(..., gt=0, description="Match number")
    shooter_name: str = Field(..., min_length=1, description="Shooter name")
    shooter_id: Optional[str] = Field(None, description="Shooter ID")
    club: str = Field(..., min_length=1, description="Club name")
    division_class: Optional[str] = Field(None, description="Division/Class")
    veteran: str = Field(..., description="Veteran status (Y/N)")
    series_1: float = Field(..., ge=0.0, le=109.0, description="Series 1 score")
    series_2: float = Field(..., ge=0.0, le=109.0, description="Series 2 score")
    series_3: float = Field(..., ge=0.0, le=109.0, description="Series 3 score")
    series_4: float = Field(..., ge=0.0, le=109.0, description="Series 4 score")
    series_5: float = Field(..., ge=0.0, le=109.0, description="Series 5 score")
    series_6: float = Field(..., ge=0.0, le=109.0, description="Series 6 score")
    total: float = Field(..., description="Total score")
    place: Optional[str] = Field(None, description="Place/rank")

    @validator('event_name')
    def validate_event_name(cls, v):
        allowed_events = [event.value for event in ISSFEventType]
        if v not in allowed_events:
            raise ValueError(f'Event name must be one of: {", ".join(allowed_events)}')
        return v

    @validator('veteran')
    def validate_veteran(cls, v):
        if v not in ['Y', 'N']:
            raise ValueError('Veteran must be Y or N')
        return v

    @validator('total')
    def validate_total(cls, v, values):
        if 'series_1' in values and 'series_2' in values and 'series_3' in values and 'series_4' in values and 'series_5' in values and 'series_6' in values:
            calculated_total = values['series_1'] + values['series_2'] + values['series_3'] + values['series_4'] + values['series_5'] + values['series_6']
            if abs(v - calculated_total) > 0.01:  # Allow small floating point differences
                raise ValueError(f'Total ({v}) does not match sum of series ({calculated_total})')
        return v


class ISSFScoreImportError(BaseModel):
    row_number: int
    field: str
    error: str
    data: dict


class ISSFScoreImportResult(BaseModel):
    records_added: int
    records_failed: int
    errors: List[ISSFScoreImportError]
    summary: str


class ISSFScoreImportResponse(BaseModel):
    success: bool
    message: str
    data: ISSFScoreImportResult


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

class EventName(str, Enum):
    PRONE_MATCH_1 = "Prone Match 1"
    PRONE_MATCH_2 = "Prone Match 2"
    THREE_P = "3P"
    AIR_RIFLE = "Air Rifle"

class MatchResultBase(BaseModel):
    event_name: EventName
    match_number: int = Field(..., ge=1)
    shooter_name: str = Field(..., min_length=1, max_length=100)
    shooter_id: Optional[Union[str, int]] = None
    club: str = Field(..., min_length=1, max_length=100)
    division: Optional[str] = Field(None, max_length=50)
    veteran: bool
    series1: float = Field(..., ge=0.0, le=109.0)
    series2: float = Field(..., ge=0.0, le=109.0)
    series3: float = Field(..., ge=0.0, le=109.0)
    series4: float = Field(..., ge=0.0, le=109.0)
    series5: float = Field(..., ge=0.0, le=109.0)
    series6: float = Field(..., ge=0.0, le=109.0)
    place: Optional[int] = Field(None, ge=1)
    total: Optional[float] = None

    @field_validator('*', mode='before')
    @classmethod
    def calculate_total(cls, v, info):
        """Calculate total from series scores"""
        if info.field_name == 'total':
            series_fields = ['series1', 'series2', 'series3', 'series4', 'series5', 'series6']
            values = info.data
            total = sum(values.get(field, 0) for field in series_fields if values.get(field) is not None)
            return round(total, 1)
        return v

class MatchResultCreate(MatchResultBase):
    """Model for creating new match results"""
    pass

class MatchResultUpdate(BaseModel):
    """Model for updating match results (all fields optional)"""
    event_name: Optional[EventName] = None
    match_number: Optional[int] = Field(None, ge=1)
    shooter_name: Optional[str] = Field(None, min_length=1, max_length=100)
    shooter_id: Optional[Union[str, int]] = None
    club: Optional[str] = Field(None, min_length=1, max_length=100)
    division: Optional[str] = Field(None, max_length=50)
    veteran: Optional[bool] = None
    series1: Optional[float] = Field(None, ge=0.0, le=109.0)
    series2: Optional[float] = Field(None, ge=0.0, le=109.0)
    series3: Optional[float] = Field(None, ge=0.0, le=109.0)
    series4: Optional[float] = Field(None, ge=0.0, le=109.0)
    series5: Optional[float] = Field(None, ge=0.0, le=109.0)
    series6: Optional[float] = Field(None, ge=0.0, le=109.0)
    place: Optional[int] = Field(None, ge=1)

class MatchResult(MatchResultBase):
    """Complete match result model with metadata"""
    id: str
    total: float
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    source: str = Field(..., pattern='^(manual|upload)$')

    class Config:
        from_attributes = True

class MatchResultUpload(BaseModel):
    """Model for uploaded match results (from CSV/Excel)"""
    event_name: EventName
    match_number: int = Field(..., ge=1)
    shooter_name: str = Field(..., min_length=1, max_length=100)
    shooter_id: Optional[Union[str, int]] = None
    club: str = Field(..., min_length=1, max_length=100)
    division: Optional[str] = Field(None, max_length=50)
    veteran: str = Field(..., pattern='^(Y|N)$')
    series1: float = Field(..., ge=0.0, le=109.0)
    series2: float = Field(..., ge=0.0, le=109.0)
    series3: float = Field(..., ge=0.0, le=109.0)
    series4: float = Field(..., ge=0.0, le=109.0)
    series5: float = Field(..., ge=0.0, le=109.0)
    series6: float = Field(..., ge=0.0, le=109.0)
    place: Optional[int] = Field(None, ge=1)

    @validator('veteran', pre=True)
    def convert_veteran_to_bool(cls, v):
        """Convert Y/N to boolean"""
        if isinstance(v, str):
            return v.upper() == 'Y'
        return v 

# Enhanced User Management Models
class UserProfile(BaseModel):
    """User profile with detailed information"""
    id: str
    firstName: str
    lastName: str
    email: EmailStr
    membershipType: MembershipType
    club: str
    role: UserRole = UserRole.USER
    profileImageUrl: Optional[str] = None
    phoneNumber: Optional[str] = Field(None, max_length=20)
    dateOfBirth: Optional[str] = Field(None, description="Date of birth in YYYY-MM-DD format")
    address: Optional[str] = Field(None, max_length=500)
    emergencyContact: Optional[str] = Field(None, max_length=100)
    emergencyPhone: Optional[str] = Field(None, max_length=20)
    isActive: bool = True
    emailConfirmed: bool = False
    createdAt: datetime
    updatedAt: Optional[datetime] = None
    lastLoginAt: Optional[datetime] = None
    loginCount: int = 0

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    """Model for updating user profile information"""
    firstName: Optional[str] = Field(None, min_length=2, max_length=50)
    lastName: Optional[str] = Field(None, min_length=2, max_length=50)
    membershipType: Optional[MembershipType] = None
    club: Optional[str] = Field(None, min_length=2, max_length=100)
    profileImageUrl: Optional[str] = None
    phoneNumber: Optional[str] = Field(None, max_length=20)
    dateOfBirth: Optional[str] = Field(None, description="Date of birth in YYYY-MM-DD format")
    address: Optional[str] = Field(None, max_length=500)
    emergencyContact: Optional[str] = Field(None, max_length=100)
    emergencyPhone: Optional[str] = Field(None, max_length=20)


class UserScoreSummary(BaseModel):
    """User's shooting score summary"""
    totalMatches: int = 0
    totalScore: int = 0
    averageScore: float = 0.0
    personalBest: int = 0
    personalBestEvent: Optional[str] = None
    personalBestDate: Optional[datetime] = None
    totalXCount: int = 0
    averageXCount: float = 0.0
    disciplines: List[str] = []
    recentScores: List[dict] = []


class UserDashboardData(BaseModel):
    """Complete user dashboard data"""
    profile: UserProfile
    scoreSummary: UserScoreSummary
    recentEvents: List[dict] = []
    upcomingEvents: List[dict] = []
    notifications: List[dict] = []


class RefreshTokenRequest(BaseModel):
    """Request model for refresh token"""
    refresh_token: str


class RefreshTokenResponse(BaseModel):
    """Response model for refresh token"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class ChangePasswordRequest(BaseModel):
    """Request model for changing password"""
    current_password: str = Field(..., min_length=1, description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v


class EmailConfirmationRequest(BaseModel):
    """Request model for email confirmation"""
    token: str = Field(..., description="Email confirmation token")


class UserSession(BaseModel):
    """User session information"""
    session_id: str
    user_id: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime
    last_activity: datetime
    is_active: bool = True


class UserActivityLog(BaseModel):
    """User activity log entry"""
    id: str
    user_id: str
    action: str = Field(..., description="Action performed")
    details: Optional[dict] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True 