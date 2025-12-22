#!/usr/bin/env python3
"""
SATRF Events API Testing Setup Script

This script helps set up and test the Events API with sample data.
"""

import asyncio
import json
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.models import EventDiscipline, EventStatus, EventSource
from app.database import db
from app.config import settings


class EventsAPITester:
    """Helper class for testing the Events API"""
    
    def __init__(self):
        self.sample_events = []
        self.api_examples = {}
    
    def generate_sample_events(self) -> List[Dict[str, Any]]:
        """Generate sample event data for testing"""
        
        base_date = datetime.utcnow()
        
        events = [
            {
                "title": "SATRF National Championship 2024",
                "description": "The premier target rifle shooting championship of the year. This three-day event features multiple disciplines and categories, bringing together the best shooters from across the country.",
                "start": (base_date + timedelta(days=30)).isoformat(),
                "end": (base_date + timedelta(days=32)).isoformat(),
                "location": "Johannesburg Shooting Range",
                "discipline": EventDiscipline.TARGET_RIFLE,
                "category": "Senior",
                "price": 500.0,
                "maxSpots": 50,
                "status": EventStatus.UPCOMING,
                "registrationDeadline": (base_date + timedelta(days=15)).isoformat(),
                "image": "/images/events/national-championship.jpg",
                "requirements": [
                    "Valid shooting license",
                    "Minimum 6 months experience",
                    "Own equipment"
                ],
                "schedule": [
                    "Day 1: Registration and Practice (8:00 AM - 5:00 PM)",
                    "Day 2: Qualification Rounds (7:00 AM - 6:00 PM)",
                    "Day 3: Finals and Awards (8:00 AM - 4:00 PM)"
                ],
                "contactInfo": {
                    "name": "John Smith",
                    "email": "john.smith@satrf.org.za",
                    "phone": "+27 11 123 4567"
                },
                "isLocal": True,
                "source": EventSource.SATRF
            },
            {
                "title": "ISSF World Cup - Air Rifle",
                "description": "International Shooting Sport Federation World Cup event for Air Rifle discipline. Top international shooters will compete for world ranking points.",
                "start": (base_date + timedelta(days=45)).isoformat(),
                "end": (base_date + timedelta(days=50)).isoformat(),
                "location": "Munich, Germany",
                "discipline": EventDiscipline.AIR_RIFLE,
                "category": "International",
                "price": 0.0,
                "maxSpots": 200,
                "status": EventStatus.UPCOMING,
                "registrationDeadline": (base_date + timedelta(days=40)).isoformat(),
                "image": "/images/events/issf-world-cup.jpg",
                "requirements": [
                    "Valid passport",
                    "ISSF membership"
                ],
                "schedule": [
                    "Day 1-2: Training and Equipment Check",
                    "Day 3-4: Qualification Rounds",
                    "Day 5: Finals and Medal Ceremony"
                ],
                "contactInfo": {
                    "name": "ISSF Secretariat",
                    "email": "info@issf-sports.org",
                    "phone": "+49 89 544 355 0"
                },
                "isLocal": False,
                "source": EventSource.ISSF
            },
            {
                "title": "SATRF Junior Development Camp",
                "description": "A comprehensive training camp designed for junior shooters to develop their skills and prepare for competitive shooting.",
                "start": (base_date + timedelta(days=60)).isoformat(),
                "end": (base_date + timedelta(days=62)).isoformat(),
                "location": "Cape Town Shooting Club",
                "discipline": EventDiscipline.THREE_POSITION,
                "category": "Junior",
                "price": 300.0,
                "maxSpots": 30,
                "status": EventStatus.UPCOMING,
                "registrationDeadline": (base_date + timedelta(days=45)).isoformat(),
                "image": "/images/events/junior-camp.jpg",
                "requirements": [
                    "Age 12-18",
                    "Basic shooting experience",
                    "Parental consent"
                ],
                "schedule": [
                    "Day 1: Fundamentals and Safety",
                    "Day 2: Advanced Techniques",
                    "Day 3: Competition Practice"
                ],
                "contactInfo": {
                    "name": "Sarah Johnson",
                    "email": "sarah.johnson@satrf.org.za",
                    "phone": "+27 21 987 6543"
                },
                "isLocal": True,
                "source": EventSource.SATRF
            },
            {
                "title": "ISSF Olympic Qualifier - Prone",
                "description": "Critical Olympic qualification event for Prone shooting discipline. This event will determine Olympic team selections.",
                "start": (base_date + timedelta(days=75)).isoformat(),
                "end": (base_date + timedelta(days=80)).isoformat(),
                "location": "Rio de Janeiro, Brazil",
                "discipline": EventDiscipline.PRONE,
                "category": "International",
                "price": 0.0,
                "maxSpots": 100,
                "status": EventStatus.UPCOMING,
                "registrationDeadline": (base_date + timedelta(days=70)).isoformat(),
                "image": "/images/events/olympic-qualifier.jpg",
                "requirements": [
                    "National team selection",
                    "ISSF qualification standards"
                ],
                "schedule": [
                    "Day 1-2: Official Training",
                    "Day 3-4: Qualification Rounds",
                    "Day 5: Finals and Team Selection"
                ],
                "contactInfo": {
                    "name": "ISSF Olympic Committee",
                    "email": "olympic@issf-sports.org",
                    "phone": "+55 21 2345 6789"
                },
                "isLocal": False,
                "source": EventSource.ISSF
            },
            {
                "title": "SATRF Club Championship",
                "description": "Monthly club championship for SATRF members. Open to all skill levels with separate categories for different experience levels.",
                "start": (base_date + timedelta(days=90)).isoformat(),
                "end": (base_date + timedelta(days=90)).isoformat(),
                "location": "Pretoria Shooting Range",
                "discipline": EventDiscipline.AIR_RIFLE,
                "category": "All Categories",
                "price": 150.0,
                "maxSpots": 40,
                "status": EventStatus.UPCOMING,
                "registrationDeadline": (base_date + timedelta(days=85)).isoformat(),
                "image": "/images/events/club-championship.jpg",
                "requirements": [
                    "SATRF membership",
                    "Valid shooting license"
                ],
                "schedule": [
                    "Morning: Registration and Practice",
                    "Afternoon: Competition Rounds",
                    "Evening: Awards Ceremony"
                ],
                "contactInfo": {
                    "name": "Mike Wilson",
                    "email": "mike.wilson@satrf.org.za",
                    "phone": "+27 12 345 6789"
                },
                "isLocal": True,
                "source": EventSource.SATRF
            }
        ]
        
        self.sample_events = events
        return events
    
    def generate_api_examples(self) -> Dict[str, Any]:
        """Generate API request/response examples"""
        
        examples = {
            "create_event": {
                "method": "POST",
                "url": "/api/v1/events/",
                "headers": {
                    "Authorization": "Bearer <your_access_token>",
                    "Content-Type": "application/json"
                },
                "body": self.sample_events[0],
                "description": "Create a new SATRF event (Admin only)"
            },
            "get_events": {
                "method": "GET",
                "url": "/api/v1/events/?discipline=Air Rifle&status=upcoming&page=1&limit=20",
                "headers": {
                    "Authorization": "Bearer <your_access_token>"
                },
                "description": "Get events with filters"
            },
            "get_event_by_id": {
                "method": "GET",
                "url": "/api/v1/events/{event_id}",
                "headers": {
                    "Authorization": "Bearer <your_access_token>"
                },
                "description": "Get a specific event by ID"
            },
            "update_event": {
                "method": "PUT",
                "url": "/api/v1/events/{event_id}",
                "headers": {
                    "Authorization": "Bearer <your_access_token>",
                    "Content-Type": "application/json"
                },
                "body": {
                    "title": "Updated Event Title",
                    "description": "Updated event description",
                    "price": 600.0,
                    "maxSpots": 60
                },
                "description": "Update an existing event (Admin only)"
            },
            "delete_event": {
                "method": "DELETE",
                "url": "/api/v1/events/{event_id}",
                "headers": {
                    "Authorization": "Bearer <your_access_token>"
                },
                "description": "Delete an event (Admin only)"
            },
            "register_for_event": {
                "method": "POST",
                "url": "/api/v1/events/{event_id}/register",
                "headers": {
                    "Authorization": "Bearer <your_access_token>",
                    "Content-Type": "application/json"
                },
                "body": {
                    "eventId": "{event_id}",
                    "paymentMethod": "credit_card",
                    "specialRequirements": "Vegetarian meal preference"
                },
                "description": "Register for an event"
            },
            "unregister_from_event": {
                "method": "DELETE",
                "url": "/api/v1/events/{event_id}/register",
                "headers": {
                    "Authorization": "Bearer <your_access_token>"
                },
                "description": "Unregister from an event"
            },
            "get_user_registrations": {
                "method": "GET",
                "url": "/api/v1/events/registrations?page=1&limit=20",
                "headers": {
                    "Authorization": "Bearer <your_access_token>"
                },
                "description": "Get user's event registrations"
            },
            "get_upcoming_events": {
                "method": "GET",
                "url": "/api/v1/events/upcoming?days=30&limit=10",
                "headers": {
                    "Authorization": "Bearer <your_access_token>"
                },
                "description": "Get upcoming events"
            },
            "get_events_by_discipline": {
                "method": "GET",
                "url": "/api/v1/events/discipline/Air Rifle",
                "headers": {
                    "Authorization": "Bearer <your_access_token>"
                },
                "description": "Get events by discipline"
            },
            "get_satrf_events": {
                "method": "GET",
                "url": "/api/v1/events/satrf",
                "headers": {
                    "Authorization": "Bearer <your_access_token>"
                },
                "description": "Get SATRF local events"
            },
            "get_issf_events": {
                "method": "GET",
                "url": "/api/v1/events/issf",
                "headers": {
                    "Authorization": "Bearer <your_access_token>"
                },
                "description": "Get ISSF international events"
            },
            "search_events": {
                "method": "GET",
                "url": "/api/v1/events/search?q=championship",
                "headers": {
                    "Authorization": "Bearer <your_access_token>"
                },
                "description": "Search events"
            },
            "get_event_registrations_admin": {
                "method": "GET",
                "url": "/api/v1/events/admin/{event_id}/registrations?page=1&limit=20",
                "headers": {
                    "Authorization": "Bearer <your_access_token>"
                },
                "description": "Get all registrations for an event (Admin only)"
            },
            "sync_issf_events": {
                "method": "POST",
                "url": "/api/v1/events/admin/sync-issf",
                "headers": {
                    "Authorization": "Bearer <your_access_token>"
                },
                "description": "Manually trigger ISSF events synchronization (Admin only)"
            },
            "get_issf_sync_status": {
                "method": "GET",
                "url": "/api/v1/events/admin/issf-sync-status",
                "headers": {
                    "Authorization": "Bearer <your_access_token>"
                },
                "description": "Get ISSF synchronization status (Admin only)"
            }
        }
        
        self.api_examples = examples
        return examples
    
    async def create_sample_events_in_database(self) -> List[str]:
        """Create sample events in the database"""
        
        print("Creating sample events in database...")
        event_ids = []
        
        for event_data in self.sample_events:
            try:
                # Add metadata
                event_data["currentSpots"] = 0
                event_data["createdAt"] = datetime.utcnow().isoformat()
                event_data["updatedAt"] = datetime.utcnow().isoformat()
                
                # Create event in database
                event_id = await db.create_document(
                    settings.firestore_collection_events,
                    event_data
                )
                
                event_ids.append(event_id)
                print(f"✅ Created event: {event_data['title']} (ID: {event_id})")
                
            except Exception as e:
                print(f"❌ Failed to create event {event_data['title']}: {e}")
        
        return event_ids
    
    def save_test_data_to_files(self):
        """Save test data to JSON files"""
        
        # Create test-data directory if it doesn't exist
        os.makedirs("test-data", exist_ok=True)
        
        # Save sample events
        with open("test-data/sample_events.json", "w") as f:
            json.dump(self.sample_events, f, indent=2)
        
        # Save API examples
        with open("test-data/api_examples.json", "w") as f:
            json.dump(self.api_examples, f, indent=2)
        
        print("✅ Test data saved to test-data/ directory")
    
    def generate_curl_examples(self) -> str:
        """Generate cURL examples for testing"""
        
        curl_examples = []
        
        for name, example in self.api_examples.items():
            curl_cmd = f"# {example['description']}\n"
            curl_cmd += f"curl -X {example['method']} \\\n"
            curl_cmd += f"  'http://localhost:8000{example['url']}' \\\n"
            
            # Add headers
            for header, value in example.get('headers', {}).items():
                curl_cmd += f"  -H '{header}: {value}' \\\n"
            
            # Add body if present
            if 'body' in example:
                curl_cmd += f"  -d '{json.dumps(example['body'])}' \\\n"
            
            curl_cmd += "  -v\n\n"
            
            curl_examples.append(curl_cmd)
        
        return "\n".join(curl_examples)
    
    def generate_testing_checklist(self) -> str:
        """Generate a testing checklist"""
        
        checklist = """# SATRF Events API Testing Checklist

## Setup Verification
- [ ] Backend server is running on http://localhost:8000
- [ ] Firebase configuration is properly set up
- [ ] JWT authentication is working
- [ ] Database collections are accessible

## Authentication Testing
- [ ] Test login endpoint to get access token
- [ ] Verify token is valid and not expired
- [ ] Test admin user authentication
- [ ] Test regular user authentication

## Event CRUD Operations
- [ ] Create a new event (Admin only)
- [ ] Get all events with pagination
- [ ] Get event by ID
- [ ] Update event (Admin only)
- [ ] Delete event (Admin only)

## Event Registration
- [ ] Register for an event
- [ ] Verify registration confirmation
- [ ] Check event participant count update
- [ ] Try to register for the same event again (should fail)
- [ ] Unregister from an event
- [ ] Verify participant count decreases

## Event Filtering and Search
- [ ] Filter events by discipline
- [ ] Filter events by status
- [ ] Filter events by source (SATRF/ISSF)
- [ ] Filter events by date range
- [ ] Search events by title/description/location
- [ ] Test pagination with filters

## Specialized Endpoints
- [ ] Get upcoming events
- [ ] Get events by discipline
- [ ] Get SATRF events only
- [ ] Get ISSF events only
- [ ] Get user registrations

## Admin Endpoints
- [ ] Get event registrations (Admin only)
- [ ] Sync ISSF events (Admin only)
- [ ] Get ISSF sync status (Admin only)

## Error Handling
- [ ] Test with invalid event ID
- [ ] Test with expired token
- [ ] Test with insufficient permissions
- [ ] Test with invalid request data
- [ ] Test with missing required fields

## Edge Cases
- [ ] Register for full event
- [ ] Register after deadline
- [ ] Register for cancelled event
- [ ] Update event with invalid data
- [ ] Delete event with registrations

## Performance Testing
- [ ] Test with large number of events
- [ ] Test pagination performance
- [ ] Test search performance
- [ ] Test concurrent registrations

## Integration Testing
- [ ] Test with frontend calendar
- [ ] Test email notifications
- [ ] Test payment integration (if applicable)
- [ ] Test mobile app integration

## Security Testing
- [ ] Test SQL injection prevention
- [ ] Test XSS prevention
- [ ] Test CSRF protection
- [ ] Test rate limiting
- [ ] Test input validation

## Documentation
- [ ] Verify OpenAPI documentation is accessible
- [ ] Test all documented endpoints
- [ ] Verify response formats match documentation
- [ ] Test error responses match documentation

## Deployment Testing
- [ ] Test in staging environment
- [ ] Test with production database
- [ ] Test with real Firebase configuration
- [ ] Test with production email service

## Notes
- Keep track of any issues found
- Document any workarounds needed
- Test both positive and negative scenarios
- Verify all business rules are enforced
"""
        
        return checklist


async def main():
    """Main function to run the setup"""
    
    print("🎯 SATRF Events API Testing Setup")
    print("=" * 50)
    
    # Initialize tester
    tester = EventsAPITester()
    
    # Generate sample data
    print("\n📝 Generating sample event data...")
    sample_events = tester.generate_sample_events()
    print(f"✅ Generated {len(sample_events)} sample events")
    
    # Generate API examples
    print("\n🔗 Generating API examples...")
    api_examples = tester.generate_api_examples()
    print(f"✅ Generated {len(api_examples)} API examples")
    
    # Save test data to files
    print("\n💾 Saving test data to files...")
    tester.save_test_data_to_files()
    
    # Generate cURL examples
    print("\n🔄 Generating cURL examples...")
    curl_examples = tester.generate_curl_examples()
    
    with open("test-data/curl_examples.sh", "w") as f:
        f.write("#!/bin/bash\n\n")
        f.write("# SATRF Events API cURL Examples\n")
        f.write("# Replace <your_access_token> with actual token\n\n")
        f.write(curl_examples)
    
    # Make the script executable
    os.chmod("test-data/curl_examples.sh", 0o755)
    print("✅ cURL examples saved to test-data/curl_examples.sh")
    
    # Generate testing checklist
    print("\n📋 Generating testing checklist...")
    checklist = tester.generate_testing_checklist()
    
    with open("test-data/testing_checklist.md", "w") as f:
        f.write(checklist)
    print("✅ Testing checklist saved to test-data/testing_checklist.md")
    
    # Ask if user wants to create sample events in database
    print("\n🗄️  Database Setup")
    print("=" * 30)
    
    create_in_db = input("Do you want to create sample events in the database? (y/n): ").lower().strip()
    
    if create_in_db == 'y':
        try:
            event_ids = await tester.create_sample_events_in_database()
            print(f"\n✅ Successfully created {len(event_ids)} events in database")
            
            # Save event IDs for reference
            with open("test-data/created_event_ids.json", "w") as f:
                json.dump(event_ids, f, indent=2)
            print("✅ Event IDs saved to test-data/created_event_ids.json")
            
        except Exception as e:
            print(f"❌ Failed to create events in database: {e}")
            print("Make sure the backend server is running and Firebase is configured")
    
    # Summary
    print("\n🎉 Setup Complete!")
    print("=" * 30)
    print("📁 Generated files:")
    print("  - test-data/sample_events.json")
    print("  - test-data/api_examples.json")
    print("  - test-data/curl_examples.sh")
    print("  - test-data/testing_checklist.md")
    
    if create_in_db == 'y':
        print("  - test-data/created_event_ids.json")
    
    print("\n🚀 Next steps:")
    print("1. Start the backend server: uvicorn app.main:app --reload")
    print("2. Get an access token by logging in")
    print("3. Update the access token in test-data/curl_examples.sh")
    print("4. Run the cURL examples to test the API")
    print("5. Follow the testing checklist in test-data/testing_checklist.md")
    
    print("\n📚 Documentation:")
    print("- API docs: http://localhost:8000/docs")
    print("- ReDoc: http://localhost:8000/redoc")
    print("- Events API docs: backend/EVENTS_API_DOCUMENTATION.md")


if __name__ == "__main__":
    asyncio.run(main()) 