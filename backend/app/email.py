"""
Email notification service using SendGrid
Handles registration confirmations, password resets, and event notifications
"""

import os
import logging
from typing import Dict, Any, Optional, List
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content, TemplateId, Personalization
from jinja2 import Environment, FileSystemLoader, Template
from app.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EmailService:
    """Email service for sending notifications via SendGrid"""
    
    def __init__(self):
        self.sg = SendGridAPIClient(api_key=settings.sendgrid_api_key)
        self.from_email = Email(settings.sendgrid_from_email, settings.sendgrid_from_name)
        
        # Initialize Jinja2 for custom templates
        template_dir = os.path.join(os.path.dirname(__file__), 'templates')
        if os.path.exists(template_dir):
            self.jinja_env = Environment(loader=FileSystemLoader(template_dir))
        else:
            self.jinja_env = None
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        content: str,
        template_id: Optional[str] = None,
        dynamic_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send an email using SendGrid
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            content: Email content (HTML)
            template_id: SendGrid template ID (optional)
            dynamic_data: Dynamic data for template (optional)
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            to_email_obj = To(to_email)
            
            if template_id and dynamic_data:
                # Use SendGrid dynamic templates
                mail = Mail(self.from_email, to_email_obj)
                mail.template_id = TemplateId(template_id)
                
                # Add personalization data
                personalization = Personalization()
                personalization.add_to(to_email_obj)
                personalization.dynamic_template_data = dynamic_data
                mail.add_personalization(personalization)
            else:
                # Use custom HTML content
                content = Content("text/html", content)
                mail = Mail(self.from_email, to_email_obj, subject, content)
            
            response = self.sg.send(mail)
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"Email sent successfully to {to_email}")
                return True
            else:
                logger.error(f"Failed to send email to {to_email}. Status: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending email to {to_email}: {str(e)}")
            return False
    
    async def send_registration_confirmation(
        self,
        to_email: str,
        user_name: str,
        confirmation_url: str
    ) -> bool:
        """
        Send registration confirmation email
        
        Args:
            to_email: User's email address
            user_name: User's name
            confirmation_url: Email confirmation URL
            
        Returns:
            bool: True if email sent successfully
        """
        subject = "Welcome to SATRF - Confirm Your Registration"
        
        if settings.sendgrid_template_id_registration:
            # Use SendGrid template
            dynamic_data = {
                "user_name": user_name,
                "confirmation_url": confirmation_url,
                "app_name": settings.app_name
            }
            return await self.send_email(
                to_email=to_email,
                subject=subject,
                content="",
                template_id=settings.sendgrid_template_id_registration,
                dynamic_data=dynamic_data
            )
        else:
            # Use custom template
            content = self._render_registration_template(user_name, confirmation_url)
            return await self.send_email(to_email, subject, content)
    
    async def send_password_reset(
        self,
        to_email: str,
        user_name: str,
        reset_url: str,
        expiry_hours: int = 24
    ) -> bool:
        """
        Send password reset email
        
        Args:
            to_email: User's email address
            user_name: User's name
            reset_url: Password reset URL
            expiry_hours: Hours until reset link expires
            
        Returns:
            bool: True if email sent successfully
        """
        subject = "SATRF - Password Reset Request"
        
        if settings.sendgrid_template_id_password_reset:
            # Use SendGrid template
            dynamic_data = {
                "user_name": user_name,
                "reset_url": reset_url,
                "expiry_hours": expiry_hours,
                "app_name": settings.app_name
            }
            return await self.send_email(
                to_email=to_email,
                subject=subject,
                content="",
                template_id=settings.sendgrid_template_id_password_reset,
                dynamic_data=dynamic_data
            )
        else:
            # Use custom template
            content = self._render_password_reset_template(user_name, reset_url, expiry_hours)
            return await self.send_email(to_email, subject, content)
    
    async def send_event_reminder(
        self,
        to_email: str,
        user_name: str,
        event_name: str,
        event_date: str,
        event_location: str,
        event_details: str
    ) -> bool:
        """
        Send event reminder email
        
        Args:
            to_email: User's email address
            user_name: User's name
            event_name: Name of the event
            event_date: Event date
            event_location: Event location
            event_details: Additional event details
            
        Returns:
            bool: True if email sent successfully
        """
        subject = f"SATRF Event Reminder: {event_name}"
        
        if settings.sendgrid_template_id_event_reminder:
            # Use SendGrid template
            dynamic_data = {
                "user_name": user_name,
                "event_name": event_name,
                "event_date": event_date,
                "event_location": event_location,
                "event_details": event_details,
                "app_name": settings.app_name
            }
            return await self.send_email(
                to_email=to_email,
                subject=subject,
                content="",
                template_id=settings.sendgrid_template_id_event_reminder,
                dynamic_data=dynamic_data
            )
        else:
            # Use custom template
            content = self._render_event_reminder_template(
                user_name, event_name, event_date, event_location, event_details
            )
            return await self.send_email(to_email, subject, content)
    
    async def send_event_confirmation(
        self,
        to_email: str,
        user_name: str,
        event_name: str,
        event_date: str,
        event_location: str,
        registration_id: str
    ) -> bool:
        """
        Send event registration confirmation email
        
        Args:
            to_email: User's email address
            user_name: User's name
            event_name: Name of the event
            event_date: Event date
            event_location: Event location
            registration_id: Registration confirmation ID
            
        Returns:
            bool: True if email sent successfully
        """
        subject = f"SATRF Event Registration Confirmed: {event_name}"
        
        if settings.sendgrid_template_id_event_confirmation:
            # Use SendGrid template
            dynamic_data = {
                "user_name": user_name,
                "event_name": event_name,
                "event_date": event_date,
                "event_location": event_location,
                "registration_id": registration_id,
                "app_name": settings.app_name
            }
            return await self.send_email(
                to_email=to_email,
                subject=subject,
                content="",
                template_id=settings.sendgrid_template_id_event_confirmation,
                dynamic_data=dynamic_data
            )
        else:
            # Use custom template
            content = self._render_event_confirmation_template(
                user_name, event_name, event_date, event_location, registration_id
            )
            return await self.send_email(to_email, subject, content)
    
    def _render_registration_template(self, user_name: str, confirmation_url: str) -> str:
        """Render registration confirmation email template"""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome to SATRF</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #1f2937; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9fafb; }}
                .button {{ display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; }}
                .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to SATRF</h1>
                </div>
                <div class="content">
                    <h2>Hello {user_name},</h2>
                    <p>Thank you for registering with the South African Target Rifle Federation!</p>
                    <p>To complete your registration, please click the button below to confirm your email address:</p>
                    <p style="text-align: center;">
                        <a href="{confirmation_url}" class="button">Confirm Email Address</a>
                    </p>
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p>{confirmation_url}</p>
                    <p>This link will expire in 24 hours for security reasons.</p>
                    <p>If you didn't create this account, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 SATRF. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        return html_content
    
    def _render_password_reset_template(self, user_name: str, reset_url: str, expiry_hours: int) -> str:
        """Render password reset email template"""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Password Reset - SATRF</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #dc2626; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9fafb; }}
                .button {{ display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; }}
                .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }}
                .warning {{ background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Request</h1>
                </div>
                <div class="content">
                    <h2>Hello {user_name},</h2>
                    <p>We received a request to reset your password for your SATRF account.</p>
                    <p>Click the button below to reset your password:</p>
                    <p style="text-align: center;">
                        <a href="{reset_url}" class="button">Reset Password</a>
                    </p>
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p>{reset_url}</p>
                    <div class="warning">
                        <strong>Important:</strong> This link will expire in {expiry_hours} hours for security reasons.
                    </div>
                    <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 SATRF. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        return html_content
    
    def _render_event_reminder_template(
        self, user_name: str, event_name: str, event_date: str, 
        event_location: str, event_details: str
    ) -> str:
        """Render event reminder email template"""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Event Reminder - SATRF</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #059669; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9fafb; }}
                .event-details {{ background-color: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Event Reminder</h1>
                </div>
                <div class="content">
                    <h2>Hello {user_name},</h2>
                    <p>This is a friendly reminder about your upcoming SATRF event:</p>
                    <div class="event-details">
                        <h3>{event_name}</h3>
                        <p><strong>Date:</strong> {event_date}</p>
                        <p><strong>Location:</strong> {event_location}</p>
                        <p><strong>Details:</strong> {event_details}</p>
                    </div>
                    <p>Please make sure to arrive on time and bring all necessary equipment.</p>
                    <p>If you have any questions, please contact the event organizer.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 SATRF. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        return html_content
    
    def _render_event_confirmation_template(
        self, user_name: str, event_name: str, event_date: str, 
        event_location: str, registration_id: str
    ) -> str:
        """Render event registration confirmation email template"""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Event Registration Confirmed - SATRF</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #059669; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9fafb; }}
                .confirmation {{ background-color: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Registration Confirmed</h1>
                </div>
                <div class="content">
                    <h2>Hello {user_name},</h2>
                    <p>Your registration for the following SATRF event has been confirmed:</p>
                    <div class="confirmation">
                        <h3>{event_name}</h3>
                        <p><strong>Date:</strong> {event_date}</p>
                        <p><strong>Location:</strong> {event_location}</p>
                        <p><strong>Registration ID:</strong> {registration_id}</p>
                    </div>
                    <p>Please keep this confirmation for your records. You will receive a reminder email closer to the event date.</p>
                    <p>If you need to make any changes to your registration, please contact the event organizer.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 SATRF. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        return html_content


# Create global email service instance
email_service = EmailService() 