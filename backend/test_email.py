#!/usr/bin/env python3
"""
Test script for email notification system
Run this script to test email functionality without affecting the main application
"""

import asyncio
import os
from dotenv import load_dotenv
from app.email import email_service

# Load environment variables
load_dotenv()


async def test_email_functionality():
    """Test all email notification functions"""
    
    print("🧪 Testing Email Notification System")
    print("=" * 50)
    
    # Test email configuration
    print("\n📧 Email Configuration:")
    print(f"From Email: {os.getenv('SENDGRID_FROM_EMAIL', 'Not set')}")
    print(f"From Name: {os.getenv('SENDGRID_FROM_NAME', 'Not set')}")
    print(f"API Key: {'Set' if os.getenv('SENDGRID_API_KEY') else 'Not set'}")
    
    # Test recipient (change this to your email for testing)
    test_email = "test@example.com"  # Change this to your email
    test_name = "Test User"
    
    print(f"\n📬 Test Recipient: {test_email}")
    print("⚠️  Change the test_email variable to your email address to receive test emails")
    
    # Test 1: Registration Confirmation
    print("\n1️⃣ Testing Registration Confirmation Email...")
    try:
        result = await email_service.send_registration_confirmation(
            to_email=test_email,
            user_name=test_name,
            confirmation_url="http://localhost:3000/confirm-email?token=test-token-123"
        )
        print(f"✅ Registration email: {'Sent' if result else 'Failed'}")
    except Exception as e:
        print(f"❌ Registration email error: {e}")
    
    # Test 2: Password Reset
    print("\n2️⃣ Testing Password Reset Email...")
    try:
        result = await email_service.send_password_reset(
            to_email=test_email,
            user_name=test_name,
            reset_url="http://localhost:3000/reset-password?token=test-reset-token-456",
            expiry_hours=24
        )
        print(f"✅ Password reset email: {'Sent' if result else 'Failed'}")
    except Exception as e:
        print(f"❌ Password reset email error: {e}")
    
    # Test 3: Event Reminder
    print("\n3️⃣ Testing Event Reminder Email...")
    try:
        result = await email_service.send_event_reminder(
            to_email=test_email,
            user_name=test_name,
            event_name="Spring Championship 2024",
            event_date="2024-03-15T09:00:00",
            event_location="Pretoria Shooting Range",
            event_details="Please bring your own equipment and arrive 30 minutes early for registration."
        )
        print(f"✅ Event reminder email: {'Sent' if result else 'Failed'}")
    except Exception as e:
        print(f"❌ Event reminder email error: {e}")
    
    # Test 4: Event Confirmation
    print("\n4️⃣ Testing Event Confirmation Email...")
    try:
        result = await email_service.send_event_confirmation(
            to_email=test_email,
            user_name=test_name,
            event_name="Spring Championship 2024",
            event_date="2024-03-15T09:00:00",
            event_location="Pretoria Shooting Range",
            registration_id="REG-2024-001"
        )
        print(f"✅ Event confirmation email: {'Sent' if result else 'Failed'}")
    except Exception as e:
        print(f"❌ Event confirmation email error: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Email testing completed!")
    print("\n📋 Next Steps:")
    print("1. Set up your SendGrid account and API key")
    print("2. Update the test_email variable with your email address")
    print("3. Run this script again to receive actual test emails")
    print("4. Check your SendGrid dashboard for delivery status")


if __name__ == "__main__":
    # Check if SendGrid API key is configured
    if not os.getenv('SENDGRID_API_KEY'):
        print("❌ SENDGRID_API_KEY not found in environment variables")
        print("Please add your SendGrid API key to the .env file")
        print("See EMAIL_NOTIFICATIONS.md for setup instructions")
    else:
        asyncio.run(test_email_functionality()) 