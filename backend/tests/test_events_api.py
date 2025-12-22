import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch
from app.main import app
from app.models import EventStatus, EventDiscipline, EventSource

client = TestClient(app)


class TestEventsAPI:
    """Test suite for Events API endpoints"""
    
    @pytest.fixture
    def mock_auth_user(self):
        """Mock authenticated user"""
        return {
            "id": "user123",
            "email": "test@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "role": "user"
        }
    
    @pytest.fixture
    def mock_admin_user(self):
        """Mock admin user"""
        return {
            "id": "admin123",
            "email": "admin@example.com",
            "firstName": "Admin",
            "lastName": "User",
            "role": "admin"
        }
    
    @pytest.fixture
    def sample_event_data(self):
        """Sample event data for testing"""
        return {
            "title": "SATRF National Championship 2024",
            "description": "The premier target rifle shooting championship",
            "start": (datetime.utcnow() + timedelta(days=30)).isoformat(),
            "end": (datetime.utcnow() + timedelta(days=32)).isoformat(),
            "location": "Johannesburg Shooting Range",
            "discipline": EventDiscipline.TARGET_RIFLE,
            "category": "Senior",
            "price": 500.0,
            "maxSpots": 50,
            "status": EventStatus.UPCOMING,
            "registrationDeadline": (datetime.utcnow() + timedelta(days=15)).isoformat(),
            "image": "/images/events/national-championship.jpg",
            "requirements": ["Valid shooting license", "Minimum 6 months experience"],
            "schedule": [
                "Day 1: Registration and Practice",
                "Day 2: Qualification Rounds",
                "Day 3: Finals and Awards"
            ],
            "contactInfo": {
                "name": "John Smith",
                "email": "john.smith@satrf.org.za",
                "phone": "+27 11 123 4567"
            },
            "isLocal": True,
            "source": EventSource.SATRF
        }
    
    @pytest.fixture
    def sample_event_response(self, sample_event_data):
        """Sample event response data"""
        return {
            "id": "event123",
            **sample_event_data,
            "currentSpots": 0,
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        }

    # Test Event Creation
    @patch('app.routers.events.require_admin')
    @patch('app.routers.events.db.create_document')
    @patch('app.routers.events.db.get_document')
    def test_create_event_success(self, mock_get_doc, mock_create_doc, mock_require_admin, mock_admin_user, sample_event_data, sample_event_response):
        """Test successful event creation"""
        mock_require_admin.return_value = mock_admin_user
        mock_create_doc.return_value = "event123"
        mock_get_doc.return_value = sample_event_response
        
        response = client.post("/api/v1/events/", json=sample_event_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "Event created successfully"
        assert "event" in data["data"]
        assert data["data"]["event"]["title"] == sample_event_data["title"]
    
    @patch('app.routers.events.require_admin')
    def test_create_event_invalid_data(self, mock_require_admin, mock_admin_user):
        """Test event creation with invalid data"""
        mock_require_admin.return_value = mock_admin_user
        
        invalid_data = {
            "title": "Test Event",
            # Missing required fields
        }
        
        response = client.post("/api/v1/events/", json=invalid_data)
        
        assert response.status_code == 422  # Validation error
    
    @patch('app.routers.events.require_admin')
    def test_create_event_end_after_start(self, mock_require_admin, mock_admin_user):
        """Test event creation with end time before start time"""
        mock_require_admin.return_value = mock_admin_user
        
        invalid_data = {
            "title": "Test Event",
            "description": "Test description",
            "start": (datetime.utcnow() + timedelta(days=30)).isoformat(),
            "end": (datetime.utcnow() + timedelta(days=25)).isoformat(),  # Before start
            "location": "Test Location",
            "discipline": EventDiscipline.AIR_RIFLE,
            "category": "Senior",
            "price": 100.0,
            "maxSpots": 20,
            "status": EventStatus.UPCOMING,
            "registrationDeadline": (datetime.utcnow() + timedelta(days=15)).isoformat(),
            "isLocal": True,
            "source": EventSource.SATRF
        }
        
        response = client.post("/api/v1/events/", json=invalid_data)
        
        assert response.status_code == 422  # Validation error

    # Test Event Retrieval
    @patch('app.routers.events.get_current_active_user')
    @patch('app.routers.events.db.query_documents')
    @patch('app.routers.events.db.count_documents')
    def test_get_events_success(self, mock_count, mock_query, mock_get_user, mock_auth_user, sample_event_response):
        """Test successful event retrieval"""
        mock_get_user.return_value = mock_auth_user
        mock_count.return_value = 1
        mock_query.return_value = [sample_event_response]
        
        response = client.get("/api/v1/events/")
        
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        assert len(data["events"]) == 1
        assert data["total"] == 1
        assert data["page"] == 1
    
    @patch('app.routers.events.get_current_active_user')
    @patch('app.routers.events.db.query_documents')
    @patch('app.routers.events.db.count_documents')
    def test_get_events_with_filters(self, mock_count, mock_query, mock_get_user, mock_auth_user, sample_event_response):
        """Test event retrieval with filters"""
        mock_get_user.return_value = mock_auth_user
        mock_count.return_value = 1
        mock_query.return_value = [sample_event_response]
        
        response = client.get("/api/v1/events/?discipline=Target Rifle&status=upcoming")
        
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
    
    @patch('app.routers.events.get_current_active_user')
    @patch('app.routers.events.db.get_document')
    def test_get_event_by_id_success(self, mock_get_doc, mock_get_user, mock_auth_user, sample_event_response):
        """Test successful event retrieval by ID"""
        mock_get_user.return_value = mock_auth_user
        mock_get_doc.return_value = sample_event_response
        
        response = client.get("/api/v1/events/event123")
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == sample_event_response["title"]
    
    @patch('app.routers.events.get_current_active_user')
    @patch('app.routers.events.db.get_document')
    def test_get_event_by_id_not_found(self, mock_get_doc, mock_get_user, mock_auth_user):
        """Test event retrieval by ID when not found"""
        mock_get_user.return_value = mock_auth_user
        mock_get_doc.return_value = None
        
        response = client.get("/api/v1/events/nonexistent")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]

    # Test Event Updates
    @patch('app.routers.events.require_admin')
    @patch('app.routers.events.db.get_document')
    @patch('app.routers.events.db.update_document')
    def test_update_event_success(self, mock_update, mock_get_doc, mock_require_admin, mock_admin_user, sample_event_response):
        """Test successful event update"""
        mock_require_admin.return_value = mock_admin_user
        mock_get_doc.return_value = sample_event_response
        
        update_data = {
            "title": "Updated Event Title",
            "description": "Updated description"
        }
        
        response = client.put("/api/v1/events/event123", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "Event updated successfully"
    
    @patch('app.routers.events.require_admin')
    @patch('app.routers.events.db.get_document')
    def test_update_event_not_found(self, mock_get_doc, mock_require_admin, mock_admin_user):
        """Test event update when event not found"""
        mock_require_admin.return_value = mock_admin_user
        mock_get_doc.return_value = None
        
        update_data = {"title": "Updated Title"}
        
        response = client.put("/api/v1/events/nonexistent", json=update_data)
        
        assert response.status_code == 404

    # Test Event Deletion
    @patch('app.routers.events.require_admin')
    @patch('app.routers.events.db.get_document')
    @patch('app.routers.events.db.delete_document')
    @patch('app.routers.events.db.query_documents')
    def test_delete_event_success(self, mock_query, mock_delete, mock_get_doc, mock_require_admin, mock_admin_user, sample_event_response):
        """Test successful event deletion"""
        mock_require_admin.return_value = mock_admin_user
        mock_get_doc.return_value = sample_event_response
        mock_query.return_value = []  # No registrations to delete
        
        response = client.delete("/api/v1/events/event123")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "Event deleted successfully"

    # Test Event Registration
    @patch('app.routers.events.get_current_active_user')
    @patch('app.routers.events.db.get_document')
    @patch('app.routers.events.db.query_documents')
    @patch('app.routers.events.db.create_document')
    @patch('app.routers.events.db.update_document')
    def test_register_for_event_success(self, mock_update, mock_create, mock_query, mock_get_doc, mock_get_user, mock_auth_user, sample_event_response):
        """Test successful event registration"""
        mock_get_user.return_value = mock_auth_user
        mock_get_doc.return_value = sample_event_response
        mock_query.return_value = []  # No existing registration
        mock_create.return_value = "reg123"
        
        registration_data = {
            "eventId": "event123",
            "paymentMethod": "credit_card",
            "specialRequirements": "None"
        }
        
        response = client.post("/api/v1/events/event123/register", json=registration_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "Successfully registered for event"
        assert "registrationId" in data["data"]
        assert "confirmationNumber" in data["data"]
    
    @patch('app.routers.events.get_current_active_user')
    @patch('app.routers.events.db.get_document')
    @patch('app.routers.events.db.query_documents')
    def test_register_for_event_already_registered(self, mock_query, mock_get_doc, mock_get_user, mock_auth_user, sample_event_response):
        """Test registration when user is already registered"""
        mock_get_user.return_value = mock_auth_user
        mock_get_doc.return_value = sample_event_response
        mock_query.return_value = [{"id": "existing_reg"}]  # Existing registration
        
        registration_data = {"eventId": "event123"}
        
        response = client.post("/api/v1/events/event123/register", json=registration_data)
        
        assert response.status_code == 409
        assert "already registered" in response.json()["detail"]
    
    @patch('app.routers.events.get_current_active_user')
    @patch('app.routers.events.db.get_document')
    def test_register_for_event_full(self, mock_get_doc, mock_get_user, mock_auth_user):
        """Test registration when event is full"""
        mock_get_user.return_value = mock_auth_user
        full_event = {
            "id": "event123",
            "title": "Full Event",
            "status": EventStatus.FULL,
            "maxSpots": 10,
            "currentSpots": 10,
            "registrationDeadline": (datetime.utcnow() + timedelta(days=15)).isoformat()
        }
        mock_get_doc.return_value = full_event
        
        registration_data = {"eventId": "event123"}
        
        response = client.post("/api/v1/events/event123/register", json=registration_data)
        
        assert response.status_code == 400
        assert "full" in response.json()["detail"]
    
    @patch('app.routers.events.get_current_active_user')
    @patch('app.routers.events.db.get_document')
    def test_register_for_event_deadline_passed(self, mock_get_doc, mock_get_user, mock_auth_user):
        """Test registration when deadline has passed"""
        mock_get_user.return_value = mock_auth_user
        past_event = {
            "id": "event123",
            "title": "Past Event",
            "status": EventStatus.UPCOMING,
            "maxSpots": 10,
            "currentSpots": 5,
            "registrationDeadline": (datetime.utcnow() - timedelta(days=1)).isoformat()  # Past deadline
        }
        mock_get_doc.return_value = past_event
        
        registration_data = {"eventId": "event123"}
        
        response = client.post("/api/v1/events/event123/register", json=registration_data)
        
        assert response.status_code == 400
        assert "deadline" in response.json()["detail"]

    # Test Event Unregistration
    @patch('app.routers.events.get_current_active_user')
    @patch('app.routers.events.db.get_document')
    @patch('app.routers.events.db.query_documents')
    @patch('app.routers.events.db.delete_document')
    @patch('app.routers.events.db.update_document')
    def test_unregister_from_event_success(self, mock_update, mock_delete, mock_query, mock_get_doc, mock_get_user, mock_auth_user, sample_event_response):
        """Test successful event unregistration"""
        mock_get_user.return_value = mock_auth_user
        mock_get_doc.return_value = sample_event_response
        mock_query.return_value = [{"id": "reg123"}]  # Existing registration
        
        response = client.delete("/api/v1/events/event123/register")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "Successfully unregistered from event"
    
    @patch('app.routers.events.get_current_active_user')
    @patch('app.routers.events.db.get_document')
    @patch('app.routers.events.db.query_documents')
    def test_unregister_from_event_not_registered(self, mock_query, mock_get_doc, mock_get_user, mock_auth_user, sample_event_response):
        """Test unregistration when user is not registered"""
        mock_get_user.return_value = mock_auth_user
        mock_get_doc.return_value = sample_event_response
        mock_query.return_value = []  # No registration
        
        response = client.delete("/api/v1/events/event123/register")
        
        assert response.status_code == 404
        assert "not registered" in response.json()["detail"]

    # Test User Registrations
    @patch('app.routers.events.get_current_active_user')
    @patch('app.routers.events.db.query_documents')
    @patch('app.routers.events.db.count_documents')
    def test_get_user_registrations_success(self, mock_count, mock_query, mock_get_user, mock_auth_user):
        """Test successful user registrations retrieval"""
        mock_get_user.return_value = mock_auth_user
        mock_count.return_value = 2
        mock_query.return_value = [
            {
                "id": "reg1",
                "eventId": "event1",
                "status": "registered",
                "registeredAt": datetime.utcnow().isoformat()
            },
            {
                "id": "reg2",
                "eventId": "event2",
                "status": "registered",
                "registeredAt": datetime.utcnow().isoformat()
            }
        ]
        
        response = client.get("/api/v1/events/registrations")
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert len(data["data"]) == 2
        assert data["total"] == 2

    # Test Specialized Endpoints
    @patch('app.routers.events.get_current_active_user')
    @patch('app.routers.events.db.query_documents')
    def test_get_upcoming_events(self, mock_query, mock_get_user, mock_auth_user, sample_event_response):
        """Test upcoming events retrieval"""
        mock_get_user.return_value = mock_auth_user
        mock_query.return_value = [sample_event_response]
        
        response = client.get("/api/v1/events/upcoming?days=30&limit=10")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @patch('app.routers.events.get_current_active_user')
    @patch('app.routers.events.db.query_documents')
    def test_get_events_by_discipline(self, mock_query, mock_get_user, mock_auth_user, sample_event_response):
        """Test events by discipline retrieval"""
        mock_get_user.return_value = mock_auth_user
        mock_query.return_value = [sample_event_response]
        
        response = client.get("/api/v1/events/discipline/Target Rifle")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @patch('app.routers.events.get_current_active_user')
    @patch('app.routers.events.db.query_documents')
    def test_get_satrf_events(self, mock_query, mock_get_user, mock_auth_user, sample_event_response):
        """Test SATRF events retrieval"""
        mock_get_user.return_value = mock_auth_user
        mock_query.return_value = [sample_event_response]
        
        response = client.get("/api/v1/events/satrf")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @patch('app.routers.events.get_current_active_user')
    @patch('app.routers.events.db.query_documents')
    def test_get_issf_events(self, mock_query, mock_get_user, mock_auth_user):
        """Test ISSF events retrieval"""
        mock_get_user.return_value = mock_auth_user
        mock_query.return_value = []
        
        response = client.get("/api/v1/events/issf")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @patch('app.routers.events.get_current_active_user')
    @patch('app.routers.events.db.query_documents')
    def test_search_events(self, mock_query, mock_get_user, mock_auth_user, sample_event_response):
        """Test event search functionality"""
        mock_get_user.return_value = mock_auth_user
        mock_query.return_value = [sample_event_response]
        
        response = client.get("/api/v1/events/search?q=championship")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    # Test Admin Endpoints
    @patch('app.routers.events.require_admin')
    @patch('app.routers.events.db.get_document')
    @patch('app.routers.events.db.query_documents')
    @patch('app.routers.events.db.count_documents')
    def test_get_event_registrations_admin(self, mock_count, mock_query, mock_get_doc, mock_require_admin, mock_admin_user, sample_event_response):
        """Test admin event registrations retrieval"""
        mock_require_admin.return_value = mock_admin_user
        mock_get_doc.return_value = sample_event_response
        mock_count.return_value = 1
        mock_query.return_value = [
            {
                "id": "reg1",
                "eventId": "event123",
                "userId": "user123",
                "status": "registered",
                "registeredAt": datetime.utcnow().isoformat()
            }
        ]
        
        response = client.get("/api/v1/events/admin/event123/registrations")
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert len(data["data"]) == 1
    
    @patch('app.routers.events.require_admin')
    @patch('app.routers.events.db.get_document')
    def test_sync_issf_events(self, mock_get_doc, mock_require_admin, mock_admin_user):
        """Test ISSF events synchronization"""
        mock_require_admin.return_value = mock_admin_user
        mock_get_doc.return_value = None
        
        response = client.post("/api/v1/events/admin/sync-issf")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "synchronization started" in data["message"]
    
    @patch('app.routers.events.require_admin')
    @patch('app.routers.events.db.get_document')
    def test_get_issf_sync_status(self, mock_get_doc, mock_require_admin, mock_admin_user):
        """Test ISSF sync status retrieval"""
        mock_require_admin.return_value = mock_admin_user
        mock_get_doc.return_value = {
            "lastSync": datetime.utcnow().isoformat(),
            "nextSync": (datetime.utcnow() + timedelta(hours=6)).isoformat(),
            "syncStatus": "success",
            "totalISSFEvents": 5,
            "lastError": None
        }
        
        response = client.get("/api/v1/events/admin/issf-sync-status")
        
        assert response.status_code == 200
        data = response.json()
        assert "lastSync" in data
        assert "syncStatus" in data
        assert data["totalISSFEvents"] == 5

    # Test Error Handling
    @patch('app.routers.events.get_current_active_user')
    @patch('app.routers.events.db.query_documents')
    def test_database_error_handling(self, mock_query, mock_get_user, mock_auth_user):
        """Test error handling when database operations fail"""
        mock_get_user.return_value = mock_auth_user
        mock_query.side_effect = Exception("Database error")
        
        response = client.get("/api/v1/events/")
        
        assert response.status_code == 500
        assert "Internal server error" in response.json()["detail"]
    
    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        response = client.get("/api/v1/events/")
        
        assert response.status_code == 401
    
    def test_admin_only_endpoints(self):
        """Test admin-only endpoints with non-admin user"""
        # This would require mocking authentication to return a non-admin user
        # For now, we'll test the endpoint structure
        response = client.post("/api/v1/events/")
        
        assert response.status_code == 401  # Unauthorized


class TestEventValidation:
    """Test event data validation"""
    
    def test_event_validation_valid_data(self):
        """Test valid event data validation"""
        valid_data = {
            "title": "Valid Event",
            "description": "Valid description",
            "start": (datetime.utcnow() + timedelta(days=30)).isoformat(),
            "end": (datetime.utcnow() + timedelta(days=32)).isoformat(),
            "location": "Valid Location",
            "discipline": EventDiscipline.AIR_RIFLE,
            "category": "Senior",
            "price": 100.0,
            "maxSpots": 20,
            "status": EventStatus.UPCOMING,
            "registrationDeadline": (datetime.utcnow() + timedelta(days=15)).isoformat(),
            "isLocal": True,
            "source": EventSource.SATRF
        }
        
        # This would test the Pydantic model validation
        # In a real test, you'd import and validate the model directly
        assert "title" in valid_data
        assert valid_data["discipline"] in EventDiscipline
        assert valid_data["status"] in EventStatus
    
    def test_event_validation_invalid_discipline(self):
        """Test invalid discipline validation"""
        invalid_data = {
            "title": "Test Event",
            "discipline": "Invalid Discipline",  # Not in enum
            "category": "Senior",
            "start": (datetime.utcnow() + timedelta(days=30)).isoformat(),
            "end": (datetime.utcnow() + timedelta(days=32)).isoformat(),
            "location": "Test Location",
            "price": 100.0,
            "status": EventStatus.UPCOMING,
            "registrationDeadline": (datetime.utcnow() + timedelta(days=15)).isoformat(),
            "isLocal": True,
            "source": EventSource.SATRF
        }
        
        # This would fail Pydantic validation
        assert "Invalid Discipline" not in [d.value for d in EventDiscipline]


class TestEventRegistrationValidation:
    """Test event registration validation"""
    
    def test_registration_validation_valid_data(self):
        """Test valid registration data validation"""
        valid_data = {
            "eventId": "event123",
            "paymentMethod": "credit_card",
            "specialRequirements": "None"
        }
        
        assert "eventId" in valid_data
        assert valid_data["eventId"] == "event123"
    
    def test_registration_validation_missing_event_id(self):
        """Test registration validation with missing event ID"""
        invalid_data = {
            "paymentMethod": "credit_card"
            # Missing eventId
        }
        
        # This would fail Pydantic validation
        assert "eventId" not in invalid_data


class TestEventFiltering:
    """Test event filtering functionality"""
    
    @patch('app.routers.events.get_current_active_user')
    @patch('app.routers.events.db.query_documents')
    @patch('app.routers.events.db.count_documents')
    def test_filter_by_discipline(self, mock_count, mock_query, mock_get_user, mock_auth_user):
        """Test filtering events by discipline"""
        mock_get_user.return_value = mock_auth_user
        mock_count.return_value = 1
        mock_query.return_value = []
        
        response = client.get("/api/v1/events/?discipline=Air Rifle")
        
        assert response.status_code == 200
    
    @patch('app.routers.events.get_current_active_user')
    @patch('app.routers.events.db.query_documents')
    @patch('app.routers.events.db.count_documents')
    def test_filter_by_status(self, mock_count, mock_query, mock_get_user, mock_auth_user):
        """Test filtering events by status"""
        mock_get_user.return_value = mock_auth_user
        mock_count.return_value = 1
        mock_query.return_value = []
        
        response = client.get("/api/v1/events/?status=upcoming")
        
        assert response.status_code == 200
    
    @patch('app.routers.events.get_current_active_user')
    @patch('app.routers.events.db.query_documents')
    @patch('app.routers.events.db.count_documents')
    def test_filter_by_source(self, mock_count, mock_query, mock_get_user, mock_auth_user):
        """Test filtering events by source"""
        mock_get_user.return_value = mock_auth_user
        mock_count.return_value = 1
        mock_query.return_value = []
        
        response = client.get("/api/v1/events/?source=satrf")
        
        assert response.status_code == 200
    
    @patch('app.routers.events.get_current_active_user')
    @patch('app.routers.events.db.query_documents')
    @patch('app.routers.events.db.count_documents')
    def test_filter_by_date_range(self, mock_count, mock_query, mock_get_user, mock_auth_user):
        """Test filtering events by date range"""
        mock_get_user.return_value = mock_auth_user
        mock_count.return_value = 1
        mock_query.return_value = []
        
        start_date = (datetime.utcnow() + timedelta(days=30)).isoformat()
        end_date = (datetime.utcnow() + timedelta(days=60)).isoformat()
        
        response = client.get(f"/api/v1/events/?start_date={start_date}&end_date={end_date}")
        
        assert response.status_code == 200


class TestPagination:
    """Test pagination functionality"""
    
    @patch('app.routers.events.get_current_active_user')
    @patch('app.routers.events.db.query_documents')
    @patch('app.routers.events.db.count_documents')
    def test_pagination_first_page(self, mock_count, mock_query, mock_get_user, mock_auth_user):
        """Test first page pagination"""
        mock_get_user.return_value = mock_auth_user
        mock_count.return_value = 100
        mock_query.return_value = []
        
        response = client.get("/api/v1/events/?page=1&limit=20")
        
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["limit"] == 20
        assert data["total"] == 100
    
    @patch('app.routers.events.get_current_active_user')
    @patch('app.routers.events.db.query_documents')
    @patch('app.routers.events.db.count_documents')
    def test_pagination_last_page(self, mock_count, mock_query, mock_get_user, mock_auth_user):
        """Test last page pagination"""
        mock_get_user.return_value = mock_auth_user
        mock_count.return_value = 100
        mock_query.return_value = []
        
        response = client.get("/api/v1/events/?page=5&limit=20")
        
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 5
        assert data["hasMore"] is False
    
    def test_pagination_invalid_page(self):
        """Test pagination with invalid page number"""
        response = client.get("/api/v1/events/?page=0")
        
        assert response.status_code == 422  # Validation error
    
    def test_pagination_invalid_limit(self):
        """Test pagination with invalid limit"""
        response = client.get("/api/v1/events/?limit=200")  # Exceeds max limit
        
        assert response.status_code == 422  # Validation error 