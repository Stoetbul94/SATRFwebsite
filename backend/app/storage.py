import os
import uuid
import mimetypes
from typing import Optional, Tuple, List
from datetime import datetime, timedelta
from fastapi import HTTPException, UploadFile
from firebase_admin import storage
from app.database import storage_bucket
from app.config import settings
from PIL import Image
import io


class FileStorageService:
    """Service for handling file storage operations with Firebase Storage"""
    
    def __init__(self):
        self.bucket = storage_bucket
    
    def _generate_unique_filename(self, original_filename: str, user_id: str) -> str:
        """Generate a unique filename for storage"""
        file_extension = os.path.splitext(original_filename)[1]
        unique_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"{user_id}_{timestamp}_{unique_id}{file_extension}"
    
    def _validate_file_type(self, content_type: str) -> bool:
        """Validate if file type is allowed"""
        return content_type in settings.allowed_file_types
    
    def _validate_file_size(self, file_size: int) -> bool:
        """Validate if file size is within limits"""
        return file_size <= settings.max_file_size
    
    def _get_storage_path(self, file_type: str, filename: str) -> str:
        """Get the storage path based on file type"""
        if file_type == "profile_image":
            return f"{settings.profile_images_path}/{filename}"
        elif file_type == "score_document":
            return f"{settings.score_documents_path}/{filename}"
        elif file_type == "event_image":
            return f"{settings.event_images_path}/{filename}"
        else:
            return f"misc/{filename}"
    
    async def upload_profile_image(self, file: UploadFile, user_id: str) -> dict:
        """Upload a profile image for a user"""
        if not self._validate_file_type(file.content_type):
            raise HTTPException(
                status_code=400,
                detail=f"File type {file.content_type} not allowed. Allowed types: {settings.allowed_file_types}"
            )
        
        # Read file content
        content = await file.read()
        
        if not self._validate_file_size(len(content)):
            raise HTTPException(
                status_code=400,
                detail=f"File size {len(content)} bytes exceeds maximum allowed size of {settings.max_file_size} bytes"
            )
        
        # Generate unique filename
        filename = self._generate_unique_filename(file.filename, user_id)
        storage_path = self._get_storage_path("profile_image", filename)
        
        # Upload to Firebase Storage
        blob = self.bucket.blob(storage_path)
        blob.upload_from_string(content, content_type=file.content_type)
        
        # Make the file publicly readable
        blob.make_public()
        
        # Get the public URL
        file_url = blob.public_url
        
        return {
            "filename": filename,
            "file_url": file_url,
            "file_size": len(content),
            "content_type": file.content_type,
            "storage_path": storage_path
        }
    
    async def upload_score_document(self, file: UploadFile, user_id: str, event_id: str) -> dict:
        """Upload a score document (PDF, image) for score verification"""
        if not self._validate_file_type(file.content_type):
            raise HTTPException(
                status_code=400,
                detail=f"File type {file.content_type} not allowed. Allowed types: {settings.allowed_file_types}"
            )
        
        # Read file content
        content = await file.read()
        
        if not self._validate_file_size(len(content)):
            raise HTTPException(
                status_code=400,
                detail=f"File size {len(content)} bytes exceeds maximum allowed size of {settings.max_file_size} bytes"
            )
        
        # Generate unique filename
        filename = self._generate_unique_filename(file.filename, user_id)
        storage_path = self._get_storage_path("score_document", filename)
        
        # Add event ID to path for organization
        storage_path = f"{storage_path.replace('.', f'_{event_id}.')}"
        
        # Upload to Firebase Storage
        blob = self.bucket.blob(storage_path)
        blob.upload_from_string(content, content_type=file.content_type)
        
        # Make the file publicly readable
        blob.make_public()
        
        # Get the public URL
        file_url = blob.public_url
        
        return {
            "filename": filename,
            "file_url": file_url,
            "file_size": len(content),
            "content_type": file.content_type,
            "storage_path": storage_path,
            "event_id": event_id
        }
    
    async def upload_event_image(self, file: UploadFile, event_id: str) -> dict:
        """Upload an event image"""
        if not self._validate_file_type(file.content_type):
            raise HTTPException(
                status_code=400,
                detail=f"File type {file.content_type} not allowed. Allowed types: {settings.allowed_file_types}"
            )
        
        # Read file content
        content = await file.read()
        
        if not self._validate_file_size(len(content)):
            raise HTTPException(
                status_code=400,
                detail=f"File size {len(content)} bytes exceeds maximum allowed size of {settings.max_file_size} bytes"
            )
        
        # Generate unique filename
        filename = self._generate_unique_filename(file.filename, event_id)
        storage_path = self._get_storage_path("event_image", filename)
        
        # Upload to Firebase Storage
        blob = self.bucket.blob(storage_path)
        blob.upload_from_string(content, content_type=file.content_type)
        
        # Make the file publicly readable
        blob.make_public()
        
        # Get the public URL
        file_url = blob.public_url
        
        return {
            "filename": filename,
            "file_url": file_url,
            "file_size": len(content),
            "content_type": file.content_type,
            "storage_path": storage_path
        }
    
    def delete_file(self, storage_path: str) -> bool:
        """Delete a file from Firebase Storage"""
        try:
            blob = self.bucket.blob(storage_path)
            blob.delete()
            return True
        except Exception as e:
            print(f"Error deleting file {storage_path}: {e}")
            return False
    
    def get_file_info(self, storage_path: str) -> Optional[dict]:
        """Get information about a file in storage"""
        try:
            blob = self.bucket.blob(storage_path)
            blob.reload()
            
            return {
                "name": blob.name,
                "size": blob.size,
                "content_type": blob.content_type,
                "created": blob.time_created,
                "updated": blob.updated,
                "public_url": blob.public_url
            }
        except Exception as e:
            print(f"Error getting file info for {storage_path}: {e}")
            return None
    
    def generate_download_url(self, storage_path: str, expires_in: int = 3600) -> Optional[str]:
        """Generate a signed download URL for private files"""
        try:
            blob = self.bucket.blob(storage_path)
            url = blob.generate_signed_url(
                version="v4",
                expiration=datetime.now() + timedelta(seconds=expires_in),
                method="GET"
            )
            return url
        except Exception as e:
            print(f"Error generating download URL for {storage_path}: {e}")
            return None
    
    def list_user_files(self, user_id: str, file_type: Optional[str] = None) -> List[dict]:
        """List all files for a specific user"""
        try:
            prefix = ""
            if file_type == "profile_image":
                prefix = f"{settings.profile_images_path}/{user_id}"
            elif file_type == "score_document":
                prefix = f"{settings.score_documents_path}/{user_id}"
            else:
                prefix = f"{user_id}"
            
            blobs = self.bucket.list_blobs(prefix=prefix)
            
            files = []
            for blob in blobs:
                files.append({
                    "name": blob.name,
                    "size": blob.size,
                    "content_type": blob.content_type,
                    "created": blob.time_created,
                    "updated": blob.updated,
                    "public_url": blob.public_url
                })
            
            return files
        except Exception as e:
            print(f"Error listing files for user {user_id}: {e}")
            return []


# Create global instance
file_storage = FileStorageService() 