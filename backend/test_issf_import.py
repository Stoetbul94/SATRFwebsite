import pytest
import pandas as pd
import io
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from app.main import app
from app.models import ISSFScoreRow, ISSFEventType

client = TestClient(app)


def create_test_excel_file(data, filename="test_scores.xlsx"):
    """Create a test Excel file with the given data"""
    df = pd.DataFrame(data)
    buffer = io.BytesIO()
    df.to_excel(buffer, index=False)
    buffer.seek(0)
    return buffer, filename


def create_test_csv_file(data, filename="test_scores.csv"):
    """Create a test CSV file with the given data"""
    df = pd.DataFrame(data)
    buffer = io.BytesIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)
    return buffer, filename


@pytest.fixture
def mock_admin_user():
    return {
        "id": "admin123",
        "email": "admin@test.com",
        "firstName": "Admin",
        "lastName": "User",
        "role": "admin"
    }


@pytest.fixture
def mock_regular_user():
    return {
        "id": "user123",
        "email": "user@test.com",
        "firstName": "Regular",
        "lastName": "User",
        "role": "user"
    }


@pytest.fixture
def valid_score_data():
    return [
        {
            "Event Name": "Prone Match 1",
            "Match Number": 1,
            "Shooter Name": "John Doe",
            "Shooter ID": "SH001",
            "Club": "Test Club",
            "Division/Class": "Senior",
            "Veteran": "N",
            "Series 1": 100.5,
            "Series 2": 98.2,
            "Series 3": 101.0,
            "Series 4": 99.8,
            "Series 5": 100.1,
            "Series 6": 97.9,
            "Total": 597.5,
            "Place": "1"
        },
        {
            "Event Name": "Air Rifle",
            "Match Number": 2,
            "Shooter Name": "Jane Smith",
            "Shooter ID": "SH002",
            "Club": "Another Club",
            "Division/Class": "Junior",
            "Veteran": "N",
            "Series 1": 95.0,
            "Series 2": 96.5,
            "Series 3": 94.8,
            "Series 4": 97.2,
            "Series 5": 95.9,
            "Series 6": 96.1,
            "Total": 575.5,
            "Place": "2"
        }
    ]


@pytest.fixture
def invalid_score_data():
    return [
        {
            "Event Name": "Invalid Event",  # Invalid event name
            "Match Number": 1,
            "Shooter Name": "John Doe",
            "Shooter ID": "SH001",
            "Club": "Test Club",
            "Division/Class": "Senior",
            "Veteran": "N",
            "Series 1": 100.5,
            "Series 2": 98.2,
            "Series 3": 101.0,
            "Series 4": 99.8,
            "Series 5": 100.1,
            "Series 6": 97.9,
            "Total": 597.5,
            "Place": "1"
        },
        {
            "Event Name": "Prone Match 1",
            "Match Number": 1,
            "Shooter Name": "",  # Empty shooter name
            "Shooter ID": "SH002",
            "Club": "Test Club",
            "Division/Class": "Senior",
            "Veteran": "N",
            "Series 1": 100.5,
            "Series 2": 98.2,
            "Series 3": 101.0,
            "Series 4": 99.8,
            "Series 5": 100.1,
            "Series 6": 97.9,
            "Total": 597.5,
            "Place": "1"
        },
        {
            "Event Name": "Prone Match 1",
            "Match Number": 1,
            "Shooter Name": "John Doe",
            "Shooter ID": "SH003",
            "Club": "Test Club",
            "Division/Class": "Senior",
            "Veteran": "Y",
            "Series 1": 110.0,  # Series > 109.0
            "Series 2": 98.2,
            "Series 3": 101.0,
            "Series 4": 99.8,
            "Series 5": 100.1,
            "Series 6": 97.9,
            "Total": 607.0,
            "Place": "1"
        },
        {
            "Event Name": "Prone Match 1",
            "Match Number": 1,
            "Shooter Name": "John Doe",
            "Shooter ID": "SH004",
            "Club": "Test Club",
            "Division/Class": "Senior",
            "Veteran": "Y",
            "Series 1": 100.5,
            "Series 2": 98.2,
            "Series 3": 101.0,
            "Series 4": 99.8,
            "Series 5": 100.1,
            "Series 6": 97.9,
            "Total": 600.0,  # Wrong total
            "Place": "1"
        }
    ]


class TestISSFScoreImport:
    
    @patch('app.routers.scores.get_current_user')
    @patch('app.routers.scores.db.create_document')
    async def test_import_valid_excel_file(self, mock_create_doc, mock_get_user, valid_score_data, mock_admin_user):
        """Test importing valid Excel file with correct data"""
        mock_get_user.return_value = mock_admin_user
        mock_create_doc.return_value = "score123"
        
        buffer, filename = create_test_excel_file(valid_score_data)
        
        response = client.post(
            "/scores/import-issf",
            files={"file": (filename, buffer.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["records_added"] == 2
        assert data["data"]["records_failed"] == 0
        assert len(data["data"]["errors"]) == 0
    
    @patch('app.routers.scores.get_current_user')
    async def test_import_valid_csv_file(self, mock_get_user, valid_score_data, mock_admin_user):
        """Test importing valid CSV file with correct data"""
        mock_get_user.return_value = mock_admin_user
        
        buffer, filename = create_test_csv_file(valid_score_data)
        
        response = client.post(
            "/scores/import-issf",
            files={"file": (filename, buffer.getvalue(), "text/csv")}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
    
    @patch('app.routers.scores.get_current_user')
    async def test_import_with_validation_errors(self, mock_get_user, invalid_score_data, mock_admin_user):
        """Test importing file with validation errors"""
        mock_get_user.return_value = mock_admin_user
        
        buffer, filename = create_test_excel_file(invalid_score_data)
        
        response = client.post(
            "/scores/import-issf",
            files={"file": (filename, buffer.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["records_added"] == 0
        assert data["data"]["records_failed"] == 4
        assert len(data["data"]["errors"]) == 4
    
    @patch('app.routers.scores.get_current_user')
    async def test_import_unauthorized_user(self, mock_get_user, valid_score_data, mock_regular_user):
        """Test importing with non-admin user"""
        mock_get_user.return_value = mock_regular_user
        
        buffer, filename = create_test_excel_file(valid_score_data)
        
        response = client.post(
            "/scores/import-issf",
            files={"file": (filename, buffer.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        )
        
        assert response.status_code == 403
        assert "Admin access required" in response.json()["detail"]
    
    @patch('app.routers.scores.get_current_user')
    async def test_import_invalid_file_type(self, mock_get_user, mock_admin_user):
        """Test importing invalid file type"""
        mock_get_user.return_value = mock_admin_user
        
        response = client.post(
            "/scores/import-issf",
            files={"file": ("test.txt", b"invalid content", "text/plain")}
        )
        
        assert response.status_code == 400
        assert "File must be .xlsx or .csv format" in response.json()["detail"]
    
    @patch('app.routers.scores.get_current_user')
    async def test_import_missing_columns(self, mock_get_user, mock_admin_user):
        """Test importing file with missing columns"""
        mock_get_user.return_value = mock_admin_user
        
        # Create data with missing columns
        incomplete_data = [
            {
                "Event Name": "Prone Match 1",
                "Match Number": 1,
                "Shooter Name": "John Doe",
                # Missing other required columns
            }
        ]
        
        buffer, filename = create_test_excel_file(incomplete_data)
        
        response = client.post(
            "/scores/import-issf",
            files={"file": (filename, buffer.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        )
        
        assert response.status_code == 400
        assert "Missing required columns" in response.json()["detail"]


class TestISSFScoreRowValidation:
    """Test the ISSFScoreRow model validation"""
    
    def test_valid_score_row(self):
        """Test creating a valid ISSFScoreRow"""
        data = {
            "event_name": "Prone Match 1",
            "match_number": 1,
            "shooter_name": "John Doe",
            "shooter_id": "SH001",
            "club": "Test Club",
            "division_class": "Senior",
            "veteran": "N",
            "series_1": 100.5,
            "series_2": 98.2,
            "series_3": 101.0,
            "series_4": 99.8,
            "series_5": 100.1,
            "series_6": 97.9,
            "total": 597.5,
            "place": "1"
        }
        
        score_row = ISSFScoreRow(**data)
        assert score_row.event_name == "Prone Match 1"
        assert score_row.total == 597.5
    
    def test_invalid_event_name(self):
        """Test validation of invalid event name"""
        data = {
            "event_name": "Invalid Event",
            "match_number": 1,
            "shooter_name": "John Doe",
            "shooter_id": "SH001",
            "club": "Test Club",
            "division_class": "Senior",
            "veteran": "N",
            "series_1": 100.5,
            "series_2": 98.2,
            "series_3": 101.0,
            "series_4": 99.8,
            "series_5": 100.1,
            "series_6": 97.9,
            "total": 597.5,
            "place": "1"
        }
        
        with pytest.raises(ValueError, match="Event name must be one of"):
            ISSFScoreRow(**data)
    
    def test_invalid_veteran_status(self):
        """Test validation of invalid veteran status"""
        data = {
            "event_name": "Prone Match 1",
            "match_number": 1,
            "shooter_name": "John Doe",
            "shooter_id": "SH001",
            "club": "Test Club",
            "division_class": "Senior",
            "veteran": "Maybe",  # Invalid
            "series_1": 100.5,
            "series_2": 98.2,
            "series_3": 101.0,
            "series_4": 99.8,
            "series_5": 100.1,
            "series_6": 97.9,
            "total": 597.5,
            "place": "1"
        }
        
        with pytest.raises(ValueError, match="Veteran must be Y or N"):
            ISSFScoreRow(**data)
    
    def test_series_out_of_range(self):
        """Test validation of series scores out of range"""
        data = {
            "event_name": "Prone Match 1",
            "match_number": 1,
            "shooter_name": "John Doe",
            "shooter_id": "SH001",
            "club": "Test Club",
            "division_class": "Senior",
            "veteran": "N",
            "series_1": 110.0,  # > 109.0
            "series_2": 98.2,
            "series_3": 101.0,
            "series_4": 99.8,
            "series_5": 100.1,
            "series_6": 97.9,
            "total": 607.0,
            "place": "1"
        }
        
        with pytest.raises(ValueError, match="ensure this value is less than or equal to 109"):
            ISSFScoreRow(**data)
    
    def test_total_mismatch(self):
        """Test validation of total not matching sum of series"""
        data = {
            "event_name": "Prone Match 1",
            "match_number": 1,
            "shooter_name": "John Doe",
            "shooter_id": "SH001",
            "club": "Test Club",
            "division_class": "Senior",
            "veteran": "N",
            "series_1": 100.5,
            "series_2": 98.2,
            "series_3": 101.0,
            "series_4": 99.8,
            "series_5": 100.1,
            "series_6": 97.9,
            "total": 600.0,  # Wrong total
            "place": "1"
        }
        
        with pytest.raises(ValueError, match="Total.*does not match sum of series"):
            ISSFScoreRow(**data)
    
    def test_empty_shooter_name(self):
        """Test validation of empty shooter name"""
        data = {
            "event_name": "Prone Match 1",
            "match_number": 1,
            "shooter_name": "",  # Empty
            "shooter_id": "SH001",
            "club": "Test Club",
            "division_class": "Senior",
            "veteran": "N",
            "series_1": 100.5,
            "series_2": 98.2,
            "series_3": 101.0,
            "series_4": 99.8,
            "series_5": 100.1,
            "series_6": 97.9,
            "total": 597.5,
            "place": "1"
        }
        
        with pytest.raises(ValueError, match="ensure this value has at least 1 character"):
            ISSFScoreRow(**data)


if __name__ == "__main__":
    pytest.main([__file__]) 