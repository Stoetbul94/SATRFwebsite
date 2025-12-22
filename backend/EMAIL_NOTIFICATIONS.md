# Email Notifications System

This document describes the email notification system implemented for the SATRF (South African Target Rifle Federation) API using SendGrid.

## Overview

The email notification system provides automated email communications for key events in the SATRF platform:

- **Registration Confirmations**: Welcome emails with email verification links
- **Password Reset**: Secure password reset functionality
- **Event Reminders**: Automated reminders for upcoming events
- **Event Confirmations**: Registration confirmations for events

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```env
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@satrf.org.za
SENDGRID_FROM_NAME=SATRF

# SendGrid Template IDs (optional - for dynamic templates)
SENDGRID_TEMPLATE_ID_REGISTRATION=d-xxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_ID_PASSWORD_RESET=d-xxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_ID_EVENT_REMINDER=d-xxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_ID_EVENT_CONFIRMATION=d-xxxxxxxxxxxxxxxxxxxxxxxx
```

### SendGrid Setup

1. Create a SendGrid account at [sendgrid.com](https://sendgrid.com)
2. Generate an API key with "Mail Send" permissions
3. Verify your sender domain or use a verified sender email
4. (Optional) Create dynamic templates in SendGrid dashboard

## Email Service Architecture

### Core Components

- **EmailService**: Main service class handling all email operations
- **Templates**: HTML email templates with inline CSS
- **Integration**: Seamless integration with existing auth and events systems

### Features

- **Template Support**: Both SendGrid dynamic templates and custom HTML templates
- **Error Handling**: Graceful failure handling without breaking main functionality
- **Logging**: Comprehensive logging for debugging and monitoring
- **Async Operations**: Non-blocking email sending

## API Endpoints

### Authentication Endpoints

#### Registration Confirmation
- **POST** `/api/v1/auth/register`
- Automatically sends confirmation email after successful registration
- Includes email verification token

#### Password Reset
- **POST** `/api/v1/auth/forgot-password`
- Sends password reset email with secure token
- **POST** `/api/v1/auth/reset-password`
- Resets password using token from email

#### Email Confirmation
- **POST** `/api/v1/auth/confirm-email`
- Confirms email address using token from registration email

### Event Endpoints

#### Event Registration
- **POST** `/api/v1/events/{event_id}/register`
- Sends event registration confirmation email
- Returns registration ID

#### Event Reminders
- **POST** `/api/v1/events/{event_id}/send-reminders`
- Admin-only endpoint to send reminders to all participants
- Returns success/failure statistics

## Email Templates

### Registration Confirmation Template

**Subject**: "Welcome to SATRF - Confirm Your Registration"

**Features**:
- Professional SATRF branding
- Email verification button
- 24-hour expiration notice
- Mobile-responsive design

**Dynamic Data**:
- `user_name`: User's full name
- `confirmation_url`: Email verification link
- `app_name`: Application name

### Password Reset Template

**Subject**: "SATRF - Password Reset Request"

**Features**:
- Security-focused design with warning styling
- Clear reset button
- Expiration time display
- Security notice

**Dynamic Data**:
- `user_name`: User's full name
- `reset_url`: Password reset link
- `expiry_hours`: Hours until link expires
- `app_name`: Application name

### Event Reminder Template

**Subject**: "SATRF Event Reminder: {event_name}"

**Features**:
- Event details in highlighted box
- Clear date and location information
- Professional reminder tone

**Dynamic Data**:
- `user_name`: User's full name
- `event_name`: Event title
- `event_date`: Event date and time
- `event_location`: Event location
- `event_details`: Additional event information
- `app_name`: Application name

### Event Confirmation Template

**Subject**: "SATRF Event Registration Confirmed: {event_name}"

**Features**:
- Registration confirmation details
- Registration ID for reference
- Professional confirmation styling

**Dynamic Data**:
- `user_name`: User's full name
- `event_name`: Event title
- `event_date`: Event date and time
- `event_location`: Event location
- `registration_id`: Unique registration identifier
- `app_name`: Application name

## Usage Examples

### Sending Registration Confirmation

```python
from app.email import email_service

# Automatically called during registration
await email_service.send_registration_confirmation(
    to_email="user@example.com",
    user_name="John Doe",
    confirmation_url="http://localhost:3000/confirm-email?token=abc123"
)
```

### Sending Password Reset

```python
# Request password reset
await email_service.send_password_reset(
    to_email="user@example.com",
    user_name="John Doe",
    reset_url="http://localhost:3000/reset-password?token=xyz789",
    expiry_hours=24
)
```

### Sending Event Reminder

```python
# Send event reminder
await email_service.send_event_reminder(
    to_email="user@example.com",
    user_name="John Doe",
    event_name="Spring Championship 2024",
    event_date="2024-03-15T09:00:00",
    event_location="Pretoria Shooting Range",
    event_details="Please bring your own equipment and arrive 30 minutes early."
)
```

### Sending Event Confirmation

```python
# Send event registration confirmation
await email_service.send_event_confirmation(
    to_email="user@example.com",
    user_name="John Doe",
    event_name="Spring Championship 2024",
    event_date="2024-03-15T09:00:00",
    event_location="Pretoria Shooting Range",
    registration_id="REG-2024-001"
)
```

## Error Handling

The email service includes comprehensive error handling:

- **SendGrid API Errors**: Logged and handled gracefully
- **Template Errors**: Fallback to custom HTML templates
- **Network Issues**: Retry logic and timeout handling
- **Invalid Emails**: Validation and error reporting

### Error Response Format

```json
{
  "success": false,
  "message": "Failed to send email",
  "error": {
    "code": "EMAIL_SEND_FAILED",
    "details": "SendGrid API error: 401 Unauthorized"
  }
}
```

## Security Considerations

### Token Security
- Email confirmation tokens are cryptographically secure (32 bytes)
- Password reset tokens expire after 24 hours
- Tokens are single-use and invalidated after use

### Email Security
- All emails use HTTPS links
- No sensitive data in email content
- Secure token generation using `secrets` module

### Rate Limiting
- Consider implementing rate limiting for email endpoints
- Monitor SendGrid usage and quotas

## Monitoring and Logging

### Log Levels
- **INFO**: Successful email sends
- **WARNING**: Template fallbacks
- **ERROR**: Failed email sends and API errors

### Metrics to Monitor
- Email delivery rates
- Bounce rates
- Open rates (if using SendGrid analytics)
- API response times

## Testing

### Unit Tests
```python
# Test email service
async def test_send_registration_email():
    result = await email_service.send_registration_confirmation(
        to_email="test@example.com",
        user_name="Test User",
        confirmation_url="http://test.com/confirm"
    )
    assert result == True
```

### Integration Tests
```python
# Test registration endpoint with email
async def test_registration_with_email():
    response = await client.post("/api/v1/auth/register", json={
        "firstName": "Test",
        "lastName": "User",
        "email": "test@example.com",
        "password": "TestPass123",
        "membershipType": "senior",
        "club": "Test Club"
    })
    assert response.status_code == 201
    # Check that email was sent (mock SendGrid in tests)
```

## Deployment Considerations

### Production Setup
1. Use verified domain for sender email
2. Set up SendGrid webhook for delivery tracking
3. Configure proper DNS records (SPF, DKIM, DMARC)
4. Monitor email deliverability

### Environment-Specific Configuration
- Development: Use test email addresses
- Staging: Use staging SendGrid account
- Production: Use production SendGrid account with proper domain verification

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check SendGrid API key
   - Verify sender email is verified
   - Check SendGrid account status

2. **Templates not working**
   - Verify template IDs in environment variables
   - Check template syntax in SendGrid dashboard
   - Fallback to custom HTML templates

3. **High bounce rates**
   - Verify recipient email addresses
   - Check domain reputation
   - Review SendGrid bounce reports

### Debug Mode
Enable debug logging by setting log level to DEBUG in your application configuration.

## Future Enhancements

### Planned Features
- Email preferences management
- Unsubscribe functionality
- Email analytics dashboard
- Template customization per user
- Bulk email campaigns
- Email scheduling

### Integration Opportunities
- SMS notifications (Twilio)
- Push notifications
- In-app notifications
- Calendar integration

## Support

For issues with the email notification system:

1. Check SendGrid dashboard for delivery status
2. Review application logs for error details
3. Verify environment configuration
4. Test with SendGrid's email testing tools

## Dependencies

- `sendgrid==6.10.0`: SendGrid Python SDK
- `jinja2==3.1.2`: Template engine for custom templates
- `email-validator==2.1.0`: Email validation
- `python-dotenv==1.0.0`: Environment variable management 