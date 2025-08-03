import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.models import UserCreate, LoginRequest, UserProfileUpdate, ChangePasswordRequest
from app.auth import create_access_token, create_user_token_data, get_password_hash

client = TestClient(app)


class TestUserRegistration:
    """Test user registration functionality"""
    
    def test_register_user_success(self):
        """Test successful user registration"""
        user_data = {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john.doe@example.com",
            "password": "SecurePass123",
            "membershipType": "senior",
            "club": "Test Club"
        }
        
        with patch('app.routers.users.db.create_document') as mock_create, \
             patch('app.routers.users.db.get_document') as mock_get, \
             patch('app.routers.users.db.get_document_by_field') as mock_get_by_field, \
             patch('app.routers.users.create_user_session') as mock_session, \
             patch('app.routers.users.log_user_activity') as mock_log:
            
            # Mock database responses
            mock_get_by_field.return_value = None  # User doesn't exist
            mock_create.return_value = "user123"
            mock_get.return_value = {
                "id": "user123",
                "firstName": "John",
                "lastName": "Doe",
                "email": "john.doe@example.com",
                "membershipType": "senior",
                "club": "Test Club",
                "role": "user",
                "createdAt": datetime.utcnow().isoformat()
            }
            mock_session.return_value = "session123"
            
            response = client.post("/api/v1/users/register", json=user_data)
            
            assert response.status_code == 201
            data = response.json()
            assert data["success"] is True
            assert data["message"] == "User registered successfully"
            assert "access_token" in data["data"]
            assert "refresh_token" in data["data"]
            assert data["data"]["user"]["email"] == "john.doe@example.com"
    
    def test_register_user_existing_email(self):
        """Test registration with existing email"""
        user_data = {
            "firstName": "John",
            "lastName": "Doe",
            "email": "existing@example.com",
            "password": "SecurePass123",
            "membershipType": "senior",
            "club": "Test Club"
        }
        
        with patch('app.routers.users.db.get_document_by_field') as mock_get_by_field:
            mock_get_by_field.return_value = {"id": "existing", "email": "existing@example.com"}
            
            response = client.post("/api/v1/users/register", json=user_data)
            
            assert response.status_code == 400
            assert "already exists" in response.json()["detail"]
    
    def test_register_user_weak_password(self):
        """Test registration with weak password"""
        user_data = {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john.doe@example.com",
            "password": "weak",
            "membershipType": "senior",
            "club": "Test Club"
        }
        
        response = client.post("/api/v1/users/register", json=user_data)
        
        assert response.status_code == 400
        data = response.json()["detail"]
        assert "Password does not meet security requirements" in data["message"]
        assert len(data["errors"]) > 0
    
    def test_register_user_invalid_email(self):
        """Test registration with invalid email"""
        user_data = {
            "firstName": "John",
            "lastName": "Doe",
            "email": "invalid-email",
            "password": "SecurePass123",
            "membershipType": "senior",
            "club": "Test Club"
        }
        
        response = client.post("/api/v1/users/register", json=user_data)
        
        assert response.status_code == 422  # Validation error


class TestUserLogin:
    """Test user login functionality"""
    
    def test_login_success(self):
        """Test successful user login"""
        login_data = {
            "email": "john.doe@example.com",
            "password": "SecurePass123"
        }
        
        hashed_password = get_password_hash("SecurePass123")
        user_data = {
            "id": "user123",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john.doe@example.com",
            "membershipType": "senior",
            "club": "Test Club",
            "role": "user",
            "hashedPassword": hashed_password,
            "isActive": True,
            "loginCount": 0,
            "createdAt": datetime.utcnow().isoformat()
        }
        
        with patch('app.routers.users.authenticate_user') as mock_auth, \
             patch('app.routers.users.create_user_session') as mock_session, \
             patch('app.routers.users.db.update_document') as mock_update, \
             patch('app.routers.users.log_user_activity') as mock_log:
            
            mock_auth.return_value = user_data
            mock_session.return_value = "session123"
            
            response = client.post("/api/v1/users/login", json=login_data)
            
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert "refresh_token" in data
            assert data["token_type"] == "bearer"
            assert data["user"]["email"] == "john.doe@example.com"
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        login_data = {
            "email": "john.doe@example.com",
            "password": "WrongPassword123"
        }
        
        with patch('app.routers.users.authenticate_user') as mock_auth:
            mock_auth.return_value = None
            
            response = client.post("/api/v1/users/login", json=login_data)
            
            assert response.status_code == 401
            assert "Invalid email or password" in response.json()["detail"]
    
    def test_login_inactive_account(self):
        """Test login with inactive account"""
        login_data = {
            "email": "inactive@example.com",
            "password": "SecurePass123"
        }
        
        user_data = {
            "id": "user123",
            "firstName": "John",
            "lastName": "Doe",
            "email": "inactive@example.com",
            "isActive": False
        }
        
        with patch('app.routers.users.authenticate_user') as mock_auth:
            mock_auth.return_value = user_data
            
            response = client.post("/api/v1/users/login", json=login_data)
            
            assert response.status_code == 400
            assert "Account is deactivated" in response.json()["detail"]


class TestUserProfile:
    """Test user profile management"""
    
    def test_get_user_profile(self):
        """Test getting user profile"""
        user_data = {
            "id": "user123",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john.doe@example.com",
            "membershipType": "senior",
            "club": "Test Club",
            "role": "user",
            "isActive": True,
            "emailConfirmed": True,
            "createdAt": datetime.utcnow().isoformat(),
            "loginCount": 5
        }
        
        token_data = create_user_token_data(user_data)
        access_token = create_access_token(token_data)
        
        with patch('app.routers.users.get_current_active_user') as mock_get_user, \
             patch('app.routers.users.update_user_session_activity') as mock_update_session:
            
            mock_get_user.return_value = user_data
            
            headers = {"Authorization": f"Bearer {access_token}"}
            response = client.get("/api/v1/users/profile", headers=headers)
            
            assert response.status_code == 200
            data = response.json()
            assert data["firstName"] == "John"
            assert data["lastName"] == "Doe"
            assert data["email"] == "john.doe@example.com"
    
    def test_update_user_profile(self):
        """Test updating user profile"""
        user_data = {
            "id": "user123",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john.doe@example.com",
            "membershipType": "senior",
            "club": "Test Club",
            "role": "user",
            "isActive": True
        }
        
        update_data = {
            "firstName": "Jane",
            "phoneNumber": "+1234567890"
        }
        
        token_data = create_user_token_data(user_data)
        access_token = create_access_token(token_data)
        
        with patch('app.routers.users.get_current_active_user') as mock_get_user, \
             patch('app.routers.users.db.update_document') as mock_update, \
             patch('app.routers.users.db.get_document') as mock_get, \
             patch('app.routers.users.log_user_activity') as mock_log:
            
            mock_get_user.return_value = user_data
            mock_update.return_value = True
            
            updated_user = user_data.copy()
            updated_user.update(update_data)
            updated_user["updatedAt"] = datetime.utcnow().isoformat()
            mock_get.return_value = updated_user
            
            headers = {"Authorization": f"Bearer {access_token}"}
            response = client.put("/api/v1/users/profile", json=update_data, headers=headers)
            
            assert response.status_code == 200
            data = response.json()
            assert data["firstName"] == "Jane"
            assert data["phoneNumber"] == "+1234567890"


class TestPasswordManagement:
    """Test password management functionality"""
    
    def test_change_password_success(self):
        """Test successful password change"""
        user_data = {
            "id": "user123",
            "email": "john.doe@example.com",
            "hashedPassword": get_password_hash("OldPassword123")
        }
        
        password_data = {
            "current_password": "OldPassword123",
            "new_password": "NewSecurePass456"
        }
        
        token_data = create_user_token_data(user_data)
        access_token = create_access_token(token_data)
        
        with patch('app.routers.users.get_current_active_user') as mock_get_user, \
             patch('app.routers.users.db.update_document') as mock_update, \
             patch('app.routers.users.log_user_activity') as mock_log:
            
            mock_get_user.return_value = user_data
            mock_update.return_value = True
            
            headers = {"Authorization": f"Bearer {access_token}"}
            response = client.post("/api/v1/users/change-password", json=password_data, headers=headers)
            
            assert response.status_code == 200
            assert response.json()["success"] is True
            assert "Password changed successfully" in response.json()["message"]
    
    def test_change_password_wrong_current(self):
        """Test password change with wrong current password"""
        user_data = {
            "id": "user123",
            "email": "john.doe@example.com",
            "hashedPassword": get_password_hash("OldPassword123")
        }
        
        password_data = {
            "current_password": "WrongPassword123",
            "new_password": "NewSecurePass456"
        }
        
        token_data = create_user_token_data(user_data)
        access_token = create_access_token(token_data)
        
        with patch('app.routers.users.get_current_active_user') as mock_get_user:
            mock_get_user.return_value = user_data
            
            headers = {"Authorization": f"Bearer {access_token}"}
            response = client.post("/api/v1/users/change-password", json=password_data, headers=headers)
            
            assert response.status_code == 400
            assert "Current password is incorrect" in response.json()["detail"]
    
    def test_forgot_password(self):
        """Test forgot password functionality"""
        request_data = {
            "email": "john.doe@example.com"
        }
        
        user_data = {
            "id": "user123",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john.doe@example.com"
        }
        
        with patch('app.routers.users.db.get_document_by_field') as mock_get_by_field, \
             patch('app.routers.users.db.update_document') as mock_update:
            
            mock_get_by_field.return_value = user_data
            mock_update.return_value = True
            
            response = client.post("/api/v1/users/forgot-password", json=request_data)
            
            assert response.status_code == 200
            assert response.json()["success"] is True


class TestTokenRefresh:
    """Test token refresh functionality"""
    
    def test_refresh_token_success(self):
        """Test successful token refresh"""
        user_data = {
            "id": "user123",
            "email": "john.doe@example.com",
            "role": "user"
        }
        
        token_data = create_user_token_data(user_data)
        refresh_token = create_access_token(token_data)  # Using access token for simplicity in test
        
        refresh_data = {
            "refresh_token": refresh_token
        }
        
        with patch('app.routers.users.verify_refresh_token') as mock_verify, \
             patch('app.routers.users.db.get_document') as mock_get, \
             patch('app.routers.users.log_user_activity') as mock_log:
            
            mock_verify.return_value = {"sub": "user123"}
            mock_get.return_value = {**user_data, "isActive": True}
            
            response = client.post("/api/v1/users/refresh", json=refresh_data)
            
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert "refresh_token" in data
            assert data["token_type"] == "bearer"
    
    def test_refresh_token_invalid(self):
        """Test refresh with invalid token"""
        refresh_data = {
            "refresh_token": "invalid_token"
        }
        
        with patch('app.routers.users.verify_refresh_token') as mock_verify:
            mock_verify.return_value = None
            
            response = client.post("/api/v1/users/refresh", json=refresh_data)
            
            assert response.status_code == 401
            assert "Invalid refresh token" in response.json()["detail"]


class TestUserDashboard:
    """Test user dashboard functionality"""
    
    def test_get_user_dashboard(self):
        """Test getting user dashboard data"""
        user_data = {
            "id": "user123",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john.doe@example.com",
            "membershipType": "senior",
            "club": "Test Club",
            "role": "user",
            "isActive": True,
            "emailConfirmed": True,
            "createdAt": datetime.utcnow().isoformat(),
            "loginCount": 5
        }
        
        token_data = create_user_token_data(user_data)
        access_token = create_access_token(token_data)
        
        with patch('app.routers.users.get_current_active_user') as mock_get_user, \
             patch('app.routers.users.get_user_profile') as mock_get_profile, \
             patch('app.routers.users.get_user_score_summary') as mock_get_scores, \
             patch('app.routers.users.db.query_documents') as mock_query:
            
            mock_get_user.return_value = user_data
            mock_get_profile.return_value = user_data
            mock_get_scores.return_value = {
                "totalMatches": 10,
                "totalScore": 5000,
                "averageScore": 500.0,
                "personalBest": 580,
                "disciplines": ["Air Rifle", "Prone"]
            }
            mock_query.return_value = []  # No events
            
            headers = {"Authorization": f"Bearer {access_token}"}
            response = client.get("/api/v1/users/dashboard", headers=headers)
            
            assert response.status_code == 200
            data = response.json()
            assert "profile" in data
            assert "scoreSummary" in data
            assert "recentEvents" in data
            assert "upcomingEvents" in data


class TestSecurityFeatures:
    """Test security features"""
    
    def test_input_sanitization(self):
        """Test input sanitization"""
        from app.auth import sanitize_input
        
        # Test dangerous characters
        dangerous_input = "<script>alert('xss')</script>"
        sanitized = sanitize_input(dangerous_input)
        assert "<" not in sanitized
        assert ">" not in sanitized
        assert "script" not in sanitized
        
        # Test normal input
        normal_input = "John Doe"
        sanitized = sanitize_input(normal_input)
        assert sanitized == "John Doe"
    
    def test_password_strength_validation(self):
        """Test password strength validation"""
        from app.auth import validate_password_strength
        
        # Test weak password
        weak_password = "weak"
        result = validate_password_strength(weak_password)
        assert result["is_valid"] is False
        assert len(result["errors"]) > 0
        
        # Test strong password
        strong_password = "SecurePass123!"
        result = validate_password_strength(strong_password)
        assert result["is_valid"] is True
        assert len(result["errors"]) == 0
    
    def test_jwt_token_validation(self):
        """Test JWT token validation"""
        user_data = {
            "id": "user123",
            "email": "john.doe@example.com",
            "role": "user"
        }
        
        # Create valid token
        token_data = create_user_token_data(user_data)
        valid_token = create_access_token(token_data)
        
        # Test with valid token
        headers = {"Authorization": f"Bearer {valid_token}"}
        with patch('app.routers.users.get_current_active_user') as mock_get_user:
            mock_get_user.return_value = user_data
            response = client.get("/api/v1/users/profile", headers=headers)
            # Should not raise 401 for valid token structure
        
        # Test with invalid token
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/v1/users/profile", headers=headers)
        assert response.status_code == 401


class TestEmailConfirmation:
    """Test email confirmation functionality"""
    
    def test_confirm_email_success(self):
        """Test successful email confirmation"""
        confirmation_data = {
            "token": "valid_confirmation_token"
        }
        
        user_data = {
            "id": "user123",
            "emailConfirmationToken": "valid_confirmation_token"
        }
        
        with patch('app.routers.users.db.query_documents') as mock_query, \
             patch('app.routers.users.db.update_document') as mock_update:
            
            mock_query.return_value = [user_data]
            mock_update.return_value = True
            
            response = client.post("/api/v1/users/confirm-email", json=confirmation_data)
            
            assert response.status_code == 200
            assert response.json()["success"] is True
            assert "Email confirmed successfully" in response.json()["message"]
    
    def test_confirm_email_invalid_token(self):
        """Test email confirmation with invalid token"""
        confirmation_data = {
            "token": "invalid_token"
        }
        
        with patch('app.routers.users.db.query_documents') as mock_query:
            mock_query.return_value = []
            
            response = client.post("/api/v1/users/confirm-email", json=confirmation_data)
            
            assert response.status_code == 400
            assert "Invalid confirmation token" in response.json()["detail"]


class TestUserActivity:
    """Test user activity logging"""
    
    def test_get_user_activity(self):
        """Test getting user activity log"""
        user_data = {
            "id": "user123",
            "email": "john.doe@example.com",
            "role": "user"
        }
        
        activity_data = [
            {
                "id": "activity1",
                "user_id": "user123",
                "action": "user_login",
                "timestamp": datetime.utcnow().isoformat(),
                "ip_address": "127.0.0.1"
            }
        ]
        
        token_data = create_user_token_data(user_data)
        access_token = create_access_token(token_data)
        
        with patch('app.routers.users.get_current_active_user') as mock_get_user, \
             patch('app.routers.users.db.query_documents') as mock_query:
            
            mock_get_user.return_value = user_data
            mock_query.return_value = activity_data
            
            headers = {"Authorization": f"Bearer {access_token}"}
            response = client.get("/api/v1/users/activity", headers=headers)
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["action"] == "user_login"


# Mock data for testing
@pytest.fixture
def mock_user_data():
    """Mock user data for testing"""
    return {
        "id": "user123",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "membershipType": "senior",
        "club": "Test Club",
        "role": "user",
        "isActive": True,
        "emailConfirmed": True,
        "createdAt": datetime.utcnow().isoformat(),
        "loginCount": 5
    }


@pytest.fixture
def mock_admin_user_data():
    """Mock admin user data for testing"""
    return {
        "id": "admin123",
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@example.com",
        "membershipType": "senior",
        "club": "Admin Club",
        "role": "admin",
        "isActive": True,
        "emailConfirmed": True,
        "createdAt": datetime.utcnow().isoformat(),
        "loginCount": 10
    }


if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 