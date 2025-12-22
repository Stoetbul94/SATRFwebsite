import pytest
from unittest.mock import Mock, patch
from fastapi import HTTPException
from app.routers.events import create_event, get_events, get_event, update_event, delete_event

class TestEventsAPI:
    """Test events API endpoints."""
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_create_event_success(self, mock_db, mock_admin_auth, sample_event_data):
        """Test successful event creation."""
        mock_db.add.return_value = None
        mock_db.commit.return_value = None
        mock_db.refresh.return_value = None
        
        # Mock the event model
        mock_event = Mock()
        mock_event.id = "test_event_id"
        mock_event.title = sample_event_data["title"]
        mock_event.description = sample_event_data["description"]
        mock_event.date = sample_event_data["date"]
        mock_event.location = sample_event_data["location"]
        mock_event.discipline = sample_event_data["discipline"]
        mock_event.maxParticipants = sample_event_data["maxParticipants"]
        mock_event.registrationDeadline = sample_event_data["registrationDeadline"]
        
        with patch('app.routers.events.Event', return_value=mock_event):
            result = await create_event(sample_event_data, mock_db, mock_admin_auth)
            
            assert result.title == sample_event_data["title"]
            assert result.description == sample_event_data["description"]
            assert result.date == sample_event_data["date"]
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_create_event_unauthorized(self, mock_db, mock_auth, sample_event_data):
        """Test event creation without admin privileges."""
        with pytest.raises(HTTPException) as exc_info:
            await create_event(sample_event_data, mock_db, mock_auth)
        
        assert exc_info.value.status_code == 403
        assert "Admin access required" in str(exc_info.value.detail)
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_events_success(self, mock_db):
        """Test successful events retrieval."""
        mock_events = [
            Mock(id="1", title="Event 1", description="Description 1", date="2024-02-15"),
            Mock(id="2", title="Event 2", description="Description 2", date="2024-02-20")
        ]
        mock_db.query.return_value.all.return_value = mock_events
        
        result = await get_events(mock_db)
        
        assert len(result) == 2
        assert result[0].title == "Event 1"
        assert result[1].title == "Event 2"
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_events_empty(self, mock_db):
        """Test events retrieval when no events exist."""
        mock_db.query.return_value.all.return_value = []
        
        result = await get_events(mock_db)
        
        assert len(result) == 0
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_event_success(self, mock_db):
        """Test successful single event retrieval."""
        mock_event = Mock(
            id="test_event_id",
            title="Test Event",
            description="Test Description",
            date="2024-02-15"
        )
        mock_db.query.return_value.filter.return_value.first.return_value = mock_event
        
        result = await get_event("test_event_id", mock_db)
        
        assert result.id == "test_event_id"
        assert result.title == "Test Event"
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_event_not_found(self, mock_db):
        """Test event retrieval when event doesn't exist."""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(HTTPException) as exc_info:
            await get_event("nonexistent_id", mock_db)
        
        assert exc_info.value.status_code == 404
        assert "Event not found" in str(exc_info.value.detail)
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_update_event_success(self, mock_db, mock_admin_auth, sample_event_data):
        """Test successful event update."""
        mock_event = Mock(
            id="test_event_id",
            title="Old Title",
            description="Old Description"
        )
        mock_db.query.return_value.filter.return_value.first.return_value = mock_event
        mock_db.commit.return_value = None
        
        update_data = {"title": "Updated Title", "description": "Updated Description"}
        result = await update_event("test_event_id", update_data, mock_db, mock_admin_auth)
        
        assert result.title == "Updated Title"
        assert result.description == "Updated Description"
        mock_db.commit.assert_called_once()
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_update_event_not_found(self, mock_db, mock_admin_auth):
        """Test event update when event doesn't exist."""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        update_data = {"title": "Updated Title"}
        
        with pytest.raises(HTTPException) as exc_info:
            await update_event("nonexistent_id", update_data, mock_db, mock_admin_auth)
        
        assert exc_info.value.status_code == 404
        assert "Event not found" in str(exc_info.value.detail)
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_update_event_unauthorized(self, mock_db, mock_auth):
        """Test event update without admin privileges."""
        update_data = {"title": "Updated Title"}
        
        with pytest.raises(HTTPException) as exc_info:
            await update_event("test_event_id", update_data, mock_db, mock_auth)
        
        assert exc_info.value.status_code == 403
        assert "Admin access required" in str(exc_info.value.detail)
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_delete_event_success(self, mock_db, mock_admin_auth):
        """Test successful event deletion."""
        mock_event = Mock(id="test_event_id", title="Test Event")
        mock_db.query.return_value.filter.return_value.first.return_value = mock_event
        mock_db.delete.return_value = None
        mock_db.commit.return_value = None
        
        result = await delete_event("test_event_id", mock_db, mock_admin_auth)
        
        assert result == {"message": "Event deleted successfully"}
        mock_db.delete.assert_called_once_with(mock_event)
        mock_db.commit.assert_called_once()
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_delete_event_not_found(self, mock_db, mock_admin_auth):
        """Test event deletion when event doesn't exist."""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(HTTPException) as exc_info:
            await delete_event("nonexistent_id", mock_db, mock_admin_auth)
        
        assert exc_info.value.status_code == 404
        assert "Event not found" in str(exc_info.value.detail)
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_delete_event_unauthorized(self, mock_db, mock_auth):
        """Test event deletion without admin privileges."""
        with pytest.raises(HTTPException) as exc_info:
            await delete_event("test_event_id", mock_db, mock_auth)
        
        assert exc_info.value.status_code == 403
        assert "Admin access required" in str(exc_info.value.detail) 