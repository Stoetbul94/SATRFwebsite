from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
import sentry_sdk
from datetime import datetime
import json

from app.config import settings
from app.email import send_email
from app.auth import get_current_user_optional

router = APIRouter(tags=["contact"])

class ContactFormData(BaseModel):
    name: str
    email: EmailStr
    subject: str
    category: str
    priority: str
    message: str
    userAgent: Optional[str] = None
    pageUrl: Optional[str] = None

class ContactResponse(BaseModel):
    success: bool
    message: str
    ticket_id: Optional[str] = None

@router.post("/contact", response_model=ContactResponse)
async def submit_contact_form(
    form_data: ContactFormData,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Submit a contact form with support request
    """
    try:
        # Generate ticket ID
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        ticket_id = f"TKT-{timestamp}"
        
        # Prepare email content
        email_subject = f"[{form_data.priority.upper()}] {form_data.subject} - {ticket_id}"
        
        # Create email body
        email_body = f"""
New Support Request - Ticket ID: {ticket_id}

Contact Information:
- Name: {form_data.name}
- Email: {form_data.email}
- Category: {form_data.category}
- Priority: {form_data.priority}

Subject: {form_data.subject}

Message:
{form_data.message}

Additional Information:
- User Agent: {form_data.userAgent or 'Not provided'}
- Page URL: {form_data.pageUrl or 'Not provided'}
- Submitted: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
- User ID: {current_user.get('uid') if current_user else 'Not logged in'}
        """
        
        # Send email notification
        try:
            await send_email(
                to_email=settings.sendgrid_from_email,  # Send to support email
                subject=email_subject,
                body=email_body,
                is_html=False
            )
            
            # Send confirmation email to user
            confirmation_body = f"""
Dear {form_data.name},

Thank you for contacting SATRF Support. We have received your message and will respond as soon as possible.

Ticket Details:
- Ticket ID: {ticket_id}
- Subject: {form_data.subject}
- Category: {form_data.category}
- Priority: {form_data.priority}

Your Message:
{form_data.message}

We typically respond within 24-48 hours during business days. If this is an urgent matter, please call us directly.

Best regards,
SATRF Support Team
            """
            
            await send_email(
                to_email=form_data.email,
                subject=f"Support Request Received - {ticket_id}",
                body=confirmation_body,
                is_html=False
            )
            
        except Exception as email_error:
            # Log email error but don't fail the request
            sentry_sdk.capture_exception(email_error, {
                "tags": {
                    "component": "contact_form",
                    "action": "send_email",
                    "ticket_id": ticket_id
                },
                "extra": {
                    "form_data": form_data.dict(),
                    "error": str(email_error)
                }
            })
        
        # Capture successful submission in Sentry
        sentry_sdk.add_breadcrumb({
            "category": "contact_form",
            "message": "Contact form submitted successfully",
            "level": "info",
            "data": {
                "ticket_id": ticket_id,
                "category": form_data.category,
                "priority": form_data.priority,
                "user_id": current_user.get('uid') if current_user else None,
            }
        })
        
        # Set user context in Sentry if user is logged in
        if current_user:
            sentry_sdk.set_user({
                "id": current_user.get('uid'),
                "email": current_user.get('email'),
                "username": current_user.get('display_name')
            })
        
        return ContactResponse(
            success=True,
            message="Your message has been sent successfully. We will respond within 24-48 hours.",
            ticket_id=ticket_id
        )
        
    except Exception as error:
        # Capture error in Sentry
        sentry_sdk.capture_exception(error, {
            "tags": {
                "component": "contact_form",
                "action": "submit"
            },
            "extra": {
                "form_data": form_data.dict() if form_data else None,
                "user_id": current_user.get('uid') if current_user else None,
            }
        })
        
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "message": "Failed to submit contact form. Please try again or contact us directly.",
                "error": "INTERNAL_ERROR"
            }
        )

@router.get("/contact/status/{ticket_id}")
async def get_contact_status(ticket_id: str):
    """
    Get status of a contact form submission (placeholder for future implementation)
    """
    # This is a placeholder endpoint for future ticket tracking functionality
    return {
        "success": True,
        "ticket_id": ticket_id,
        "status": "received",
        "message": "Ticket tracking feature coming soon"
    } 