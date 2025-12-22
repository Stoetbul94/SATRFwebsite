import pytest
from unittest.mock import Mock, patch
from app.auth import get_current_user, create_access_token, verify_password, get_password_hash
from fastapi import HTTPException

class TestAuthentication:
    """Test authentication functions."""
    
    @pytest.mark.unit
    def test_get_password_hash(self):
        """Test password hashing."""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert len(hashed) > len(password)
        assert hashed.startswith("$2b$")
    
    @pytest.mark.unit
    def test_verify_password(self):
        """Test password verification."""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True
        assert verify_password("wrongpassword", hashed) is False
    
    @pytest.mark.unit
    def test_create_access_token(self):
        """Test JWT token creation."""
        data = {"sub": "test@example.com"}
        token = create_access_token(data)
        
        assert isinstance(token, str)
        assert len(token) > 0
    
    @pytest.mark.asyncio
    async def test_get_current_user_valid_token(self, mock_firebase):
        """Test getting current user with valid token."""
        mock_request = Mock()
        mock_request.headers = {"Authorization": "Bearer valid_token"}
        
        with patch('app.auth.auth.verify_id_token') as mock_verify:
            mock_verify.return_value = {
                'uid': 'test_user_id',
                'email': 'test@example.com'
            }
            
            user = await get_current_user(mock_request)
            
            assert user.id == 'test_user_id'
            assert user.email == 'test@example.com'
    
    @pytest.mark.asyncio
    async def test_get_current_user_missing_token(self):
        """Test getting current user with missing token."""
        mock_request = Mock()
        mock_request.headers = {}
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(mock_request)
        
        assert exc_info.value.status_code == 401
        assert "Could not validate credentials" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self, mock_firebase):
        """Test getting current user with invalid token."""
        mock_request = Mock()
        mock_request.headers = {"Authorization": "Bearer invalid_token"}
        
        with patch('app.auth.auth.verify_id_token') as mock_verify:
            mock_verify.side_effect = Exception("Invalid token")
            
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(mock_request)
            
            assert exc_info.value.status_code == 401
            assert "Could not validate credentials" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_get_current_user_wrong_header_format(self):
        """Test getting current user with wrong header format."""
        mock_request = Mock()
        mock_request.headers = {"Authorization": "InvalidFormat token"}
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(mock_request)
        
        assert exc_info.value.status_code == 401
        assert "Could not validate credentials" in str(exc_info.value.detail) 