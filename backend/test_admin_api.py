#!/usr/bin/env python3
"""
Test script for SATRF Admin API endpoints
Run this script to test the admin functionality
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
API_VERSION = "v1"
ADMIN_BASE = f"{BASE_URL}/api/{API_VERSION}/admin"

# Test admin credentials (you'll need to create this user first)
ADMIN_EMAIL = "admin@satrf.com"
ADMIN_PASSWORD = "AdminPass123"

def login_admin():
    """Login as admin and get JWT token"""
    login_url = f"{BASE_URL}/api/{API_VERSION}/auth/login"
    
    login_data = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    
    try:
        response = requests.post(login_url, json=login_data)
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            print(f"Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def test_endpoint(method, endpoint, token=None, data=None, description=""):
    """Test an admin endpoint"""
    url = f"{ADMIN_BASE}{endpoint}"
    headers = {"Content-Type": "application/json"}
    
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers)
        elif method.upper() == "POST":
            response = requests.post(url, headers=headers, json=data)
        elif method.upper() == "PUT":
            response = requests.put(url, headers=headers, json=data)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers)
        
        print(f"\n{'='*60}")
        print(f"Testing: {description}")
        print(f"Method: {method.upper()}")
        print(f"Endpoint: {endpoint}")
        print(f"Status: {response.status_code}")
        
        if response.status_code < 300:
            print("✅ SUCCESS")
            try:
                result = response.json()
                print(f"Response: {json.dumps(result, indent=2)}")
            except:
                print(f"Response: {response.text}")
        else:
            print("❌ FAILED")
            print(f"Error: {response.text}")
        
        return response.status_code < 300
        
    except Exception as e:
        print(f"\n{'='*60}")
        print(f"Testing: {description}")
        print(f"Method: {method.upper()}")
        print(f"Endpoint: {endpoint}")
        print(f"❌ ERROR: {e}")
        return False

def main():
    """Run all admin API tests"""
    print("🚀 SATRF Admin API Test Suite")
    print(f"Testing against: {BASE_URL}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Login as admin
    print("\n🔐 Logging in as admin...")
    token = login_admin()
    
    if not token:
        print("❌ Failed to login as admin. Please ensure:")
        print("1. The backend server is running")
        print("2. An admin user exists with the credentials:")
        print(f"   Email: {ADMIN_EMAIL}")
        print(f"   Password: {ADMIN_PASSWORD}")
        print("3. The admin user has the 'admin' role")
        return
    
    print("✅ Admin login successful")
    
    # Test dashboard stats endpoints
    print("\n📊 Testing Dashboard Statistics...")
    
    test_endpoint("GET", "/stats/overview", token, description="Get dashboard overview")
    test_endpoint("GET", "/stats/users?period=30d", token, description="Get user statistics")
    test_endpoint("GET", "/stats/events", token, description="Get event statistics")
    test_endpoint("GET", "/stats/scores", token, description="Get score statistics")
    
    # Test user management endpoints
    print("\n👥 Testing User Management...")
    
    test_endpoint("GET", "/users?page=1&limit=5", token, description="Get users (paginated)")
    test_endpoint("GET", "/users?search=admin", token, description="Search users")
    test_endpoint("GET", "/users?role=user", token, description="Filter users by role")
    
    # Test event management endpoints
    print("\n📅 Testing Event Management...")
    
    test_endpoint("GET", "/events?page=1&limit=5", token, description="Get events (paginated)")
    test_endpoint("GET", "/events?status=open", token, description="Filter events by status")
    
    # Test score management endpoints
    print("\n🎯 Testing Score Management...")
    
    test_endpoint("GET", "/scores/pending?page=1&limit=5", token, description="Get pending scores")
    test_endpoint("GET", "/scores?page=1&limit=5", token, description="Get all scores")
    test_endpoint("GET", "/scores?status=approved", token, description="Filter scores by status")
    
    # Test system administration endpoints
    print("\n⚙️ Testing System Administration...")
    
    test_endpoint("GET", "/system/health", token, description="Get system health")
    test_endpoint("POST", "/system/backup", token, description="Trigger system backup")
    
    print("\n🎉 Admin API test suite completed!")
    print("\nNote: Some endpoints may return empty results if no data exists.")
    print("This is normal for a fresh installation.")

if __name__ == "__main__":
    main() 