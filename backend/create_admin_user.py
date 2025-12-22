#!/usr/bin/env python3
"""
Script to create an admin user for testing the SATRF Admin API
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
API_VERSION = "v1"

# Admin user details
ADMIN_USER = {
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@satrf.com",
    "password": "AdminPass123",
    "membershipType": "senior",
    "club": "SATRF Admin"
}

def create_admin_user():
    """Create an admin user"""
    register_url = f"{BASE_URL}/api/{API_VERSION}/auth/register"
    
    try:
        print("🔧 Creating admin user...")
        print(f"Email: {ADMIN_USER['email']}")
        print(f"Password: {ADMIN_USER['password']}")
        
        response = requests.post(register_url, json=ADMIN_USER)
        
        if response.status_code == 201:
            print("✅ Admin user created successfully!")
            user_data = response.json()
            print(f"User ID: {user_data.get('id')}")
            
            # Now we need to manually update the user role to admin
            # This would typically be done through the admin API or database
            print("\n⚠️  IMPORTANT: You need to manually set the user role to 'admin'")
            print("You can do this by:")
            print("1. Using the admin API (if you have another admin user)")
            print("2. Directly updating the database")
            print("3. Using the Firebase console")
            
            return True
        else:
            print(f"❌ Failed to create admin user: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        return False

def test_login():
    """Test login with the admin user"""
    login_url = f"{BASE_URL}/api/{API_VERSION}/auth/login"
    
    login_data = {
        "email": ADMIN_USER["email"],
        "password": ADMIN_USER["password"]
    }
    
    try:
        print("\n🔐 Testing login...")
        response = requests.post(login_url, json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            user = data.get("user", {})
            
            print("✅ Login successful!")
            print(f"User role: {user.get('role', 'user')}")
            print(f"Token: {token[:50]}...")
            
            if user.get("role") == "admin":
                print("🎉 User has admin role!")
                return token
            else:
                print("⚠️  User does not have admin role yet")
                return None
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def main():
    """Main function"""
    print("🚀 SATRF Admin User Creation Script")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Target URL: {BASE_URL}")
    
    # Check if server is running
    try:
        health_response = requests.get(f"{BASE_URL}/health")
        if health_response.status_code != 200:
            print("❌ Backend server is not responding")
            return
        print("✅ Backend server is running")
    except:
        print("❌ Cannot connect to backend server")
        print("Please ensure the server is running on http://localhost:8000")
        return
    
    # Create admin user
    if create_admin_user():
        # Test login
        token = test_login()
        
        if token:
            print("\n🎉 Setup complete! You can now:")
            print("1. Run the admin API test script: python test_admin_api.py")
            print("2. Use the admin endpoints in your frontend")
            print("3. Access the admin dashboard")
        else:
            print("\n⚠️  Setup partially complete. You need to:")
            print("1. Set the user role to 'admin' manually")
            print("2. Then test the login again")
    else:
        print("\n❌ Setup failed. Please check the error messages above.")

if __name__ == "__main__":
    main() 