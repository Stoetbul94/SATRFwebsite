"""
Firestore document structure for match results
This defines the exact schema used in Firestore collections
"""

from typing import Dict, Any, Optional
from datetime import datetime

# Firestore document structure for match results
MATCH_RESULT_SCHEMA = {
    "collection": "match_results",
    "document_structure": {
        # Event information
        "event_name": str,  # "Prone Match 1", "Prone Match 2", "3P", "Air Rifle"
        "match_number": int,
        
        # Shooter information
        "shooter_name": str,
        "shooter_id": Optional[str],  # Store as string for consistency
        "club": str,
        "division": Optional[str],
        "veteran": bool,
        
        # Scores (stored as floats)
        "series1": float,
        "series2": float,
        "series3": float,
        "series4": float,
        "series5": float,
        "series6": float,
        
        # Calculated fields
        "total": float,
        "place": Optional[int],
        
        # Metadata
        "created_at": datetime,
        "updated_at": datetime,
        "created_by": Optional[str],
        "source": str,  # "manual" or "upload"
    }
}

# Firestore indexes for efficient querying
MATCH_RESULT_INDEXES = [
    # Primary queries
    {"fields": ["event_name", "match_number", "total"]},
    {"fields": ["event_name", "match_number", "place"]},
    {"fields": ["club", "event_name", "match_number"]},
    {"fields": ["shooter_name", "event_name", "match_number"]},
    
    # Leaderboard queries
    {"fields": ["event_name", "total", "shooter_name"]},
    {"fields": ["event_name", "match_number", "total", "place"]},
    
    # Admin queries
    {"fields": ["source", "created_at"]},
    {"fields": ["created_by", "created_at"]},
]

def validate_match_result_document(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and normalize a match result document for Firestore
    """
    # Ensure required fields
    required_fields = [
        "event_name", "match_number", "shooter_name", "club", "veteran",
        "series1", "series2", "series3", "series4", "series5", "series6"
    ]
    
    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")
    
    # Validate event name
    valid_events = ["Prone Match 1", "Prone Match 2", "3P", "Air Rifle"]
    if data["event_name"] not in valid_events:
        raise ValueError(f"Invalid event_name: {data['event_name']}")
    
    # Validate series scores (0.0 to 109.0)
    for i in range(1, 7):
        series_key = f"series{i}"
        score = data[series_key]
        if not isinstance(score, (int, float)) or score < 0.0 or score > 109.0:
            raise ValueError(f"Invalid {series_key}: {score}")
    
    # Calculate total if not provided
    if "total" not in data:
        data["total"] = round(
            data["series1"] + data["series2"] + data["series3"] + 
            data["series4"] + data["series5"] + data["series6"], 1
        )
    
    # Ensure timestamps
    if "created_at" not in data:
        data["created_at"] = datetime.utcnow()
    if "updated_at" not in data:
        data["updated_at"] = datetime.utcnow()
    
    # Normalize shooter_id to string
    if "shooter_id" in data and data["shooter_id"] is not None:
        data["shooter_id"] = str(data["shooter_id"])
    
    # Ensure source field
    if "source" not in data:
        data["source"] = "manual"
    
    return data

def create_match_result_document(
    event_name: str,
    match_number: int,
    shooter_name: str,
    club: str,
    veteran: bool,
    series1: float,
    series2: float,
    series3: float,
    series4: float,
    series5: float,
    series6: float,
    shooter_id: Optional[str] = None,
    division: Optional[str] = None,
    place: Optional[int] = None,
    created_by: Optional[str] = None,
    source: str = "manual"
) -> Dict[str, Any]:
    """
    Create a properly formatted match result document for Firestore
    """
    total = round(series1 + series2 + series3 + series4 + series5 + series6, 1)
    
    document = {
        "event_name": event_name,
        "match_number": match_number,
        "shooter_name": shooter_name,
        "club": club,
        "veteran": veteran,
        "series1": series1,
        "series2": series2,
        "series3": series3,
        "series4": series4,
        "series5": series5,
        "series6": series6,
        "total": total,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "source": source
    }
    
    # Add optional fields
    if shooter_id is not None:
        document["shooter_id"] = str(shooter_id)
    if division is not None:
        document["division"] = division
    if place is not None:
        document["place"] = place
    if created_by is not None:
        document["created_by"] = created_by
    
    return validate_match_result_document(document) 