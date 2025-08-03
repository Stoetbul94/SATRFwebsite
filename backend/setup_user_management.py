#!/usr/bin/env python3
"""
SATRF User Management Setup Script

This script helps set up and test the user management system.
It creates test users, validates the API endpoints, and provides
example usage patterns.
"""

import asyncio
import json
import requests
from datetime import datetime
from typing import Dict, Any

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"
TEST_EMAIL = "test@satrf.org.za"
TEST_PASSWORD = "TestPass123!"


class UserManagementTester:
    """Test class for user management functionality"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.access_token = None
        self.refresh_token = None
        self.session_id = None
        self.test_user_id = None
    
    def print_section(self, title: str):
        """Print a formatted section header"""
        print(f"\n{'='*60}")
        print(f" {title}")
        print(f"{'='*60}")
    
    def print_success(self, message: str):
        """Print success message"""
        print(f"✅ {message}")
    
    def print_error(self, message: str):
        """Print error message"""
        print(f"❌ {message}")
    
    def print_info(self, message: str):
        """Print info message"""
        print(f"ℹ️  {message}")
    
    def test_health_check(self) -> bool:
        """Test API health check"""
        try:
            response = requests.get(f"{self.base_url.replace('/api/v1', '')}/health")
            if response.status_code == 200:
                self.print_success("Health check passed")
                return True
            else:
                self.print_error(f"Health check failed: {response.status_code}")
                return False
        except Exception as e:
            self.print_error(f"Health check failed: {e}")
            return False
    
    def test_user_registration(self) -> bool:
        """Test user registration"""
        user_data = {
            "firstName": "Test",
            "lastName": "User",
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "membershipType": "senior",
            "club": "Test Shooting Club"
        }
        
        try:
            response = requests.post(f"{self.base_url}/users/register", json=user_data)
            
            if response.status_code == 201:
                data = response.json()
                if data.get("success"):
                    self.access_token = data["data"]["access_token"]
                    self.refresh_token = data["data"]["refresh_token"]
                    self.session_id = data["data"]["session_id"]
                    self.test_user_id = data["data"]["user"]["id"]
                    self.print_success("User registration successful")
                    return True
                else:
                    self.print_error("User registration failed")
                    return False
            else:
                self.print_error(f"User registration failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            self.print_error(f"User registration failed: {e}")
            return False
    
    def test_user_login(self) -> bool:
        """Test user login"""
        login_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        try:
            response = requests.post(f"{self.base_url}/users/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access_token"]
                self.refresh_token = data["refresh_token"]
                self.print_success("User login successful")
                return True
            else:
                self.print_error(f"User login failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            self.print_error(f"User login failed: {e}")
            return False
    
    def test_get_profile(self) -> bool:
        """Test getting user profile"""
        if not self.access_token:
            self.print_error("No access token available")
            return False
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "X-Session-ID": self.session_id
        }
        
        try:
            response = requests.get(f"{self.base_url}/users/profile", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.print_success("Get profile successful")
                self.print_info(f"User: {data['firstName']} {data['lastName']}")
                self.print_info(f"Email: {data['email']}")
                self.print_info(f"Club: {data['club']}")
                return True
            else:
                self.print_error(f"Get profile failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            self.print_error(f"Get profile failed: {e}")
            return False
    
    def test_update_profile(self) -> bool:
        """Test updating user profile"""
        if not self.access_token:
            self.print_error("No access token available")
            return False
        
        update_data = {
            "phoneNumber": "+27123456789",
            "address": "123 Test Street, Pretoria, 0001"
        }
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.put(f"{self.base_url}/users/profile", json=update_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.print_success("Update profile successful")
                self.print_info(f"Phone: {data['phoneNumber']}")
                self.print_info(f"Address: {data['address']}")
                return True
            else:
                self.print_error(f"Update profile failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            self.print_error(f"Update profile failed: {e}")
            return False
    
    def test_get_dashboard(self) -> bool:
        """Test getting user dashboard"""
        if not self.access_token:
            self.print_error("No access token available")
            return False
        
        headers = {
            "Authorization": f"Bearer {self.access_token}"
        }
        
        try:
            response = requests.get(f"{self.base_url}/users/dashboard", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.print_success("Get dashboard successful")
                self.print_info(f"Profile: {data['profile']['firstName']} {data['profile']['lastName']}")
                self.print_info(f"Score Summary: {data['scoreSummary']['totalMatches']} matches")
                return True
            else:
                self.print_error(f"Get dashboard failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            self.print_error(f"Get dashboard failed: {e}")
            return False
    
    def test_change_password(self) -> bool:
        """Test changing password"""
        if not self.access_token:
            self.print_error("No access token available")
            return False
        
        password_data = {
            "current_password": TEST_PASSWORD,
            "new_password": "NewTestPass456!"
        }
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(f"{self.base_url}/users/change-password", json=password_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.print_success("Change password successful")
                    # Update the stored password for subsequent tests
                    global TEST_PASSWORD
                    TEST_PASSWORD = "NewTestPass456!"
                    return True
                else:
                    self.print_error("Change password failed")
                    return False
            else:
                self.print_error(f"Change password failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            self.print_error(f"Change password failed: {e}")
            return False
    
    def test_token_refresh(self) -> bool:
        """Test token refresh"""
        if not self.refresh_token:
            self.print_error("No refresh token available")
            return False
        
        refresh_data = {
            "refresh_token": self.refresh_token
        }
        
        try:
            response = requests.post(f"{self.base_url}/users/refresh", json=refresh_data)
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access_token"]
                self.refresh_token = data["refresh_token"]
                self.print_success("Token refresh successful")
                return True
            else:
                self.print_error(f"Token refresh failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            self.print_error(f"Token refresh failed: {e}")
            return False
    
    def test_get_activity(self) -> bool:
        """Test getting user activity"""
        if not self.access_token:
            self.print_error("No access token available")
            return False
        
        headers = {
            "Authorization": f"Bearer {self.access_token}"
        }
        
        try:
            response = requests.get(f"{self.base_url}/users/activity", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.print_success("Get activity successful")
                self.print_info(f"Activity count: {len(data)}")
                return True
            else:
                self.print_error(f"Get activity failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            self.print_error(f"Get activity failed: {e}")
            return False
    
    def test_user_logout(self) -> bool:
        """Test user logout"""
        if not self.access_token:
            self.print_error("No access token available")
            return False
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "X-Session-ID": self.session_id
        }
        
        try:
            response = requests.post(f"{self.base_url}/users/logout", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.print_success("User logout successful")
                    return True
                else:
                    self.print_error("User logout failed")
                    return False
            else:
                self.print_error(f"User logout failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            self.print_error(f"User logout failed: {e}")
            return False
    
    def run_all_tests(self) -> Dict[str, bool]:
        """Run all tests and return results"""
        results = {}
        
        self.print_section("SATRF User Management API Testing")
        
        # Test health check
        results["health_check"] = self.test_health_check()
        
        # Test user registration
        results["registration"] = self.test_user_registration()
        
        # Test user login
        results["login"] = self.test_user_login()
        
        # Test profile operations
        results["get_profile"] = self.test_get_profile()
        results["update_profile"] = self.test_update_profile()
        
        # Test dashboard
        results["dashboard"] = self.test_get_dashboard()
        
        # Test password change
        results["change_password"] = self.test_change_password()
        
        # Test token refresh
        results["token_refresh"] = self.test_token_refresh()
        
        # Test activity logging
        results["activity"] = self.test_get_activity()
        
        # Test logout
        results["logout"] = self.test_user_logout()
        
        # Print summary
        self.print_section("Test Results Summary")
        passed = sum(results.values())
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name:20} {status}")
        
        print(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.print_success("All tests passed! User management system is working correctly.")
        else:
            self.print_error(f"{total - passed} tests failed. Please check the implementation.")
        
        return results


def create_example_requests():
    """Create example API requests for documentation"""
    examples = {
        "registration": {
            "method": "POST",
            "url": f"{API_BASE_URL}/users/register",
            "headers": {"Content-Type": "application/json"},
            "body": {
                "firstName": "John",
                "lastName": "Doe",
                "email": "john.doe@example.com",
                "password": "SecurePass123",
                "membershipType": "senior",
                "club": "Pretoria Shooting Club"
            }
        },
        "login": {
            "method": "POST",
            "url": f"{API_BASE_URL}/users/login",
            "headers": {"Content-Type": "application/json"},
            "body": {
                "email": "john.doe@example.com",
                "password": "SecurePass123"
            }
        },
        "get_profile": {
            "method": "GET",
            "url": f"{API_BASE_URL}/users/profile",
            "headers": {
                "Authorization": "Bearer <access_token>",
                "X-Session-ID": "<session_id>"
            }
        },
        "update_profile": {
            "method": "PUT",
            "url": f"{API_BASE_URL}/users/profile",
            "headers": {
                "Authorization": "Bearer <access_token>",
                "Content-Type": "application/json"
            },
            "body": {
                "firstName": "Jane",
                "phoneNumber": "+27123456789",
                "address": "456 Oak Avenue, Johannesburg, 2000"
            }
        },
        "get_dashboard": {
            "method": "GET",
            "url": f"{API_BASE_URL}/users/dashboard",
            "headers": {"Authorization": "Bearer <access_token>"}
        },
        "change_password": {
            "method": "POST",
            "url": f"{API_BASE_URL}/users/change-password",
            "headers": {
                "Authorization": "Bearer <access_token>",
                "Content-Type": "application/json"
            },
            "body": {
                "current_password": "OldPassword123",
                "new_password": "NewSecurePass456"
            }
        },
        "refresh_token": {
            "method": "POST",
            "url": f"{API_BASE_URL}/users/refresh",
            "headers": {"Content-Type": "application/json"},
            "body": {"refresh_token": "<refresh_token>"}
        },
        "logout": {
            "method": "POST",
            "url": f"{API_BASE_URL}/users/logout",
            "headers": {
                "Authorization": "Bearer <access_token>",
                "X-Session-ID": "<session_id>"
            }
        }
    }
    
    # Save examples to file
    with open("api_examples.json", "w") as f:
        json.dump(examples, f, indent=2)
    
    print("✅ API examples saved to api_examples.json")


def main():
    """Main function"""
    print("SATRF User Management Setup Script")
    print("=" * 50)
    
    # Check if API is running
    tester = UserManagementTester(API_BASE_URL)
    
    if not tester.test_health_check():
        print("\n❌ API is not running. Please start the FastAPI server first:")
        print("   cd backend")
        print("   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        return
    
    # Run all tests
    results = tester.run_all_tests()
    
    # Create example requests
    print("\n" + "="*60)
    print(" Creating API Examples")
    print("="*60)
    create_example_requests()
    
    # Print next steps
    print("\n" + "="*60)
    print(" Next Steps")
    print("="*60)
    print("1. Review the test results above")
    print("2. Check the generated api_examples.json file")
    print("3. Read the USER_MANAGEMENT_API_DOCUMENTATION.md")
    print("4. Run the test suite: pytest tests/test_user_management.py -v")
    print("5. Integrate with your frontend application")
    print("\nFor more information, see the documentation files in the backend directory.")


if __name__ == "__main__":
    main() 