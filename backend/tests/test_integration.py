import pytest
from httpx import AsyncClient
from unittest.mock import patch, Mock
from app.main import app

class TestIntegration:
    """Integration tests for API endpoints."""
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_registration_flow_end_to_end(self, async_client):
        """Test complete registration flow from registration to login."""
        # Step 1: Register a new user
        registration_data = {
            "firstName": "Integration",
            "lastName": "Test",
            "email": "integration.test@example.com",
            "password": "testpassword123"
        }
        
        with patch('app.routers.auth.create_user_with_email_and_password') as mock_create_user:
            mock_create_user.return_value = Mock(
                user=Mock(uid="test_user_id", email="integration.test@example.com")
            )
            
            response = await async_client.post("/auth/register", json=registration_data)
            
            assert response.status_code == 201
            assert "User registered successfully" in response.json()["message"]
        
        # Step 2: Login with the registered user
        login_data = {
            "email": "integration.test@example.com",
            "password": "testpassword123"
        }
        
        with patch('app.routers.auth.sign_in_with_email_and_password') as mock_sign_in:
            mock_sign_in.return_value = Mock(
                user=Mock(uid="test_user_id", email="integration.test@example.com")
            )
            
            with patch('app.routers.auth.auth.create_custom_token') as mock_token:
                mock_token.return_value.decode.return_value = "test_jwt_token"
                
                response = await async_client.post("/auth/login", json=login_data)
                
                assert response.status_code == 200
                assert "access_token" in response.json()
                assert response.json()["token_type"] == "bearer"
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_event_creation_and_retrieval(self, async_client):
        """Test event creation and retrieval flow."""
        # Create an event (requires admin privileges)
        event_data = {
            "title": "Integration Test Event",
            "description": "Test event for integration testing",
            "date": "2024-03-15",
            "location": "Test Range",
            "discipline": "Rifle",
            "maxParticipants": 30,
            "registrationDeadline": "2024-03-10"
        }
        
        with patch('app.routers.events.get_current_user') as mock_auth:
            mock_auth.return_value = Mock(
                id="admin_user_id",
                email="admin@example.com",
                is_admin=True
            )
            
            with patch('app.routers.events.get_db') as mock_db:
                mock_db.return_value = Mock()
                mock_db.return_value.add.return_value = None
                mock_db.return_value.commit.return_value = None
                mock_db.return_value.refresh.return_value = None
                
                response = await async_client.post("/events/", json=event_data)
                
                assert response.status_code == 201
                assert response.json()["title"] == event_data["title"]
                assert response.json()["description"] == event_data["description"]
        
        # Retrieve the created event
        with patch('app.routers.events.get_db') as mock_db:
            mock_event = Mock(
                id="test_event_id",
                title=event_data["title"],
                description=event_data["description"],
                date=event_data["date"],
                location=event_data["location"],
                discipline=event_data["discipline"],
                maxParticipants=event_data["maxParticipants"],
                registrationDeadline=event_data["registrationDeadline"]
            )
            mock_db.return_value.query.return_value.filter.return_value.first.return_value = mock_event
            
            response = await async_client.get("/events/test_event_id")
            
            assert response.status_code == 200
            assert response.json()["title"] == event_data["title"]
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_score_submission_and_leaderboard(self, async_client):
        """Test score submission and leaderboard retrieval flow."""
        # Submit a score
        score_data = {
            "eventId": "test_event_id",
            "score": 950,
            "discipline": "Rifle",
            "notes": "Integration test score"
        }
        
        with patch('app.routers.scores.get_current_user') as mock_auth:
            mock_auth.return_value = Mock(
                id="test_user_id",
                email="test@example.com",
                is_admin=False
            )
            
            with patch('app.routers.scores.get_db') as mock_db:
                mock_db.return_value = Mock()
                mock_db.return_value.add.return_value = None
                mock_db.return_value.commit.return_value = None
                mock_db.return_value.refresh.return_value = None
                
                response = await async_client.post("/scores/", json=score_data)
                
                assert response.status_code == 201
                assert response.json()["score"] == score_data["score"]
        
        # Retrieve leaderboard
        with patch('app.routers.leaderboard.get_db') as mock_db:
            mock_score = Mock(
                id="1",
                score=950,
                user=Mock(firstName="Test", lastName="User"),
                event=Mock(title="Test Event", discipline="Rifle"),
                createdAt="2024-01-15"
            )
            mock_db.return_value.query.return_value.join.return_value.order_by.return_value.limit.return_value.all.return_value = [mock_score]
            
            response = await async_client.get("/leaderboard/")
            
            assert response.status_code == 200
            assert len(response.json()) == 1
            assert response.json()[0]["score"] == 950
            assert response.json()[0]["playerName"] == "Test User"
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_authentication_flow(self, async_client):
        """Test complete authentication flow with protected endpoints."""
        # Login to get token
        login_data = {
            "email": "test@example.com",
            "password": "testpassword123"
        }
        
        with patch('app.routers.auth.sign_in_with_email_and_password') as mock_sign_in:
            mock_sign_in.return_value = Mock(
                user=Mock(uid="test_user_id", email="test@example.com")
            )
            
            with patch('app.routers.auth.auth.create_custom_token') as mock_token:
                mock_token.return_value.decode.return_value = "test_jwt_token"
                
                response = await async_client.post("/auth/login", json=login_data)
                token = response.json()["access_token"]
        
        # Use token to access protected endpoint
        headers = {"Authorization": f"Bearer {token}"}
        
        with patch('app.routers.auth.get_current_user') as mock_auth:
            mock_auth.return_value = Mock(
                id="test_user_id",
                email="test@example.com",
                is_admin=False
            )
            
            response = await async_client.get("/auth/me", headers=headers)
            
            assert response.status_code == 200
            assert response.json()["email"] == "test@example.com"
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_error_handling_flow(self, async_client):
        """Test error handling across different scenarios."""
        # Test invalid registration data
        invalid_registration = {
            "firstName": "",  # Empty first name
            "lastName": "Test",
            "email": "invalid-email",  # Invalid email
            "password": "123"  # Too short password
        }
        
        response = await async_client.post("/auth/register", json=invalid_registration)
        
        assert response.status_code == 422  # Validation error
        
        # Test accessing protected endpoint without token
        response = await async_client.get("/auth/me")
        
        assert response.status_code == 401  # Unauthorized
        
        # Test accessing admin endpoint with non-admin user
        with patch('app.routers.admin.get_current_user') as mock_auth:
            mock_auth.return_value = Mock(
                id="test_user_id",
                email="test@example.com",
                is_admin=False
            )
            
            response = await async_client.get("/admin/users")
            
            assert response.status_code == 403  # Forbidden 