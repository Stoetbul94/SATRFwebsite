import pytest
from unittest.mock import Mock, patch
from fastapi import HTTPException
from app.routers.leaderboard import get_leaderboard, get_user_rank

class TestLeaderboardAPI:
    """Test leaderboard API endpoints."""
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_leaderboard_success(self, mock_db):
        """Test successful leaderboard retrieval."""
        mock_scores = [
            Mock(
                id="1",
                score=950,
                user=Mock(firstName="John", lastName="Doe"),
                event=Mock(title="Event 1", discipline="Rifle"),
                createdAt="2024-01-15"
            ),
            Mock(
                id="2",
                score=920,
                user=Mock(firstName="Jane", lastName="Smith"),
                event=Mock(title="Event 2", discipline="Pistol"),
                createdAt="2024-01-14"
            ),
            Mock(
                id="3",
                score=890,
                user=Mock(firstName="Bob", lastName="Johnson"),
                event=Mock(title="Event 1", discipline="Rifle"),
                createdAt="2024-01-13"
            )
        ]
        
        mock_db.query.return_value.join.return_value.order_by.return_value.limit.return_value.all.return_value = mock_scores
        
        result = await get_leaderboard(mock_db)
        
        assert len(result) == 3
        assert result[0].score == 950
        assert result[0].playerName == "John Doe"
        assert result[1].score == 920
        assert result[1].playerName == "Jane Smith"
        assert result[2].score == 890
        assert result[2].playerName == "Bob Johnson"
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_leaderboard_empty(self, mock_db):
        """Test leaderboard retrieval when no scores exist."""
        mock_db.query.return_value.join.return_value.order_by.return_value.limit.return_value.all.return_value = []
        
        result = await get_leaderboard(mock_db)
        
        assert len(result) == 0
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_leaderboard_with_limit(self, mock_db):
        """Test leaderboard retrieval with custom limit."""
        mock_scores = [
            Mock(
                id="1",
                score=950,
                user=Mock(firstName="John", lastName="Doe"),
                event=Mock(title="Event 1", discipline="Rifle"),
                createdAt="2024-01-15"
            )
        ]
        
        mock_db.query.return_value.join.return_value.order_by.return_value.limit.return_value.all.return_value = mock_scores
        
        result = await get_leaderboard(mock_db, limit=1)
        
        assert len(result) == 1
        assert result[0].score == 950
        assert result[0].playerName == "John Doe"
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_leaderboard_by_discipline(self, mock_db):
        """Test leaderboard retrieval filtered by discipline."""
        mock_scores = [
            Mock(
                id="1",
                score=950,
                user=Mock(firstName="John", lastName="Doe"),
                event=Mock(title="Event 1", discipline="Rifle"),
                createdAt="2024-01-15"
            )
        ]
        
        mock_db.query.return_value.join.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = mock_scores
        
        result = await get_leaderboard(mock_db, discipline="Rifle")
        
        assert len(result) == 1
        assert result[0].discipline == "Rifle"
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_user_rank_success(self, mock_db, mock_auth):
        """Test successful user rank retrieval."""
        mock_user_scores = [
            Mock(score=920, rank=2),
            Mock(score=890, rank=3)
        ]
        
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = mock_user_scores
        
        result = await get_user_rank(mock_db, mock_auth)
        
        assert len(result) == 2
        assert result[0].rank == 2
        assert result[0].score == 920
        assert result[1].rank == 3
        assert result[1].score == 890
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_user_rank_empty(self, mock_db, mock_auth):
        """Test user rank retrieval when user has no scores."""
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = []
        
        result = await get_user_rank(mock_db, mock_auth)
        
        assert len(result) == 0
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_user_rank_by_discipline(self, mock_db, mock_auth):
        """Test user rank retrieval filtered by discipline."""
        mock_user_scores = [
            Mock(score=920, rank=2, event=Mock(discipline="Rifle"))
        ]
        
        mock_db.query.return_value.join.return_value.filter.return_value.order_by.return_value.all.return_value = mock_user_scores
        
        result = await get_user_rank(mock_db, mock_auth, discipline="Rifle")
        
        assert len(result) == 1
        assert result[0].rank == 2
        assert result[0].score == 920
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_leaderboard_data_structure(self, mock_db):
        """Test that leaderboard data has correct structure."""
        mock_score = Mock(
            id="1",
            score=950,
            user=Mock(firstName="John", lastName="Doe"),
            event=Mock(title="Test Event", discipline="Rifle"),
            createdAt="2024-01-15"
        )
        
        mock_db.query.return_value.join.return_value.order_by.return_value.limit.return_value.all.return_value = [mock_score]
        
        result = await get_leaderboard(mock_db)
        
        assert len(result) == 1
        score_data = result[0]
        
        # Check that all required fields are present
        assert hasattr(score_data, 'id')
        assert hasattr(score_data, 'score')
        assert hasattr(score_data, 'playerName')
        assert hasattr(score_data, 'discipline')
        assert hasattr(score_data, 'eventTitle')
        assert hasattr(score_data, 'date')
        assert hasattr(score_data, 'rank')
        
        assert score_data.score == 950
        assert score_data.playerName == "John Doe"
        assert score_data.discipline == "Rifle"
        assert score_data.eventTitle == "Test Event" 