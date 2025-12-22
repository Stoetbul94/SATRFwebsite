from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Application Configuration
    app_name: str = "SATRF API"
    app_version: str = "v1"
    debug: bool = True
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    environment: str = "development"

    # Firebase Configuration
    firebase_project_id: str = ""
    firebase_private_key_id: str = ""
    firebase_private_key: str = ""
    firebase_client_email: str = ""
    firebase_client_id: str = ""
    firebase_auth_uri: str = "https://accounts.google.com/o/oauth2/auth"
    firebase_token_uri: str = "https://oauth2.googleapis.com/token"
    firebase_auth_provider_x509_cert_url: str = "https://www.googleapis.com/oauth2/v1/certs"
    firebase_client_x509_cert_url: str = ""

    # Firebase Storage Configuration
    firebase_storage_bucket: str = ""
    firebase_storage_base_url: str = "https://storage.googleapis.com"

    # Email Configuration (SendGrid)
    sendgrid_api_key: str = ""
    sendgrid_from_email: str = "noreply@satrf.org.za"
    sendgrid_from_name: str = "SATRF"
    sendgrid_template_id_registration: str = ""
    sendgrid_template_id_password_reset: str = ""
    sendgrid_template_id_event_reminder: str = ""
    sendgrid_template_id_event_confirmation: str = ""

    # Sentry Configuration
    sentry_dsn: str = ""

    # CORS Configuration
    allowed_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    allowed_methods: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allowed_headers: List[str] = ["*"]

    # File Upload Configuration
    max_file_size: int = 10485760  # 10MB
    upload_dir: str = "uploads"
    allowed_file_types: List[str] = [
        "image/jpeg",
        "image/png", 
        "image/gif",
        "application/pdf"
    ]
    
    # File Storage Paths
    profile_images_path: str = "profile-images"
    score_documents_path: str = "score-documents"
    event_images_path: str = "event-images"

    # Database Configuration
    firestore_collection_users: str = "users"
    firestore_collection_events: str = "events"
    firestore_collection_event_registrations: str = "event_registrations"
    firestore_collection_scores: str = "scores"
    firestore_collection_leaderboard: str = "leaderboard"
    firestore_collection_system: str = "system"

    class Config:
        env_file = ".env"
        case_sensitive = False


# Create settings instance
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.upload_dir, exist_ok=True) 