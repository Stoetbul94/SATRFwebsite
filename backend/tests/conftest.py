import pytest
import asyncio
from unittest.mock import Mock, patch
import os
import tempfile

# Test database URL
TEST_DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def test_client():
    """Create a mock test client for the FastAPI app."""
    return Mock()

@pytest.fixture
async def async_client():
    """Create a mock async test client for the FastAPI app."""
    return Mock()

@pytest.fixture
def mock_db():
    """Mock database session."""
    with patch('app.database.get_db') as mock:
        mock_session = Mock()
        mock.return_value = mock_session
        yield mock_session

@pytest.fixture
def mock_auth():
    """Mock authentication."""
    mock_user = Mock()
    mock_user.id = "test_user_id"
    mock_user.email = "test@example.com"
    mock_user.is_admin = False
    return mock_user

@pytest.fixture
def mock_admin_auth():
    """Mock admin authentication."""
    mock_user = Mock()
    mock_user.id = "admin_user_id"
    mock_user.email = "admin@example.com"
    mock_user.is_admin = True
    return mock_user

@pytest.fixture
def mock_firebase():
    """Mock Firebase authentication."""
    mock_auth = Mock()
    mock_auth.verify_id_token.return_value = {
        'uid': 'test_user_id',
        'email': 'test@example.com'
    }
    return mock_auth

@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "password": "testpassword123"
    }

@pytest.fixture
def sample_event_data():
    """Sample event data for testing."""
    return {
        "title": "Test Shooting Competition",
        "description": "A test shooting competition",
        "date": "2024-02-15",
        "location": "Test Range",
        "discipline": "Rifle",
        "maxParticipants": 50,
        "registrationDeadline": "2024-02-10"
    }

@pytest.fixture
def sample_score_data():
    """Sample score data for testing."""
    return {
        "eventId": "test_event_id",
        "score": 950,
        "discipline": "Rifle",
        "notes": "Test score submission"
    }

@pytest.fixture
def temp_file():
    """Create a temporary file for testing file uploads."""
    with tempfile.NamedTemporaryFile(delete=False, suffix='.txt') as f:
        f.write(b"Test file content")
        temp_path = f.name
    
    yield temp_path
    
    # Cleanup
    if os.path.exists(temp_path):
        os.unlink(temp_path) 