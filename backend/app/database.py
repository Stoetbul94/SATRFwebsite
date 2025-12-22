import firebase_admin
from firebase_admin import credentials, firestore, storage
from typing import Dict, List, Optional, Any
from datetime import datetime
import json
from app.config import settings
import os


def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        # Check if Firebase app is already initialized
        firebase_admin.get_app()
        print("Firebase already initialized")
        return
    except ValueError:
        pass

    # Firebase credentials
    firebase_creds = {
        "type": "service_account",
        "project_id": settings.firebase_project_id,
        "private_key_id": settings.firebase_private_key_id,
        "private_key": settings.firebase_private_key.replace('\\n', '\n'),
        "client_email": settings.firebase_client_email,
        "client_id": settings.firebase_client_id,
        "auth_uri": settings.firebase_auth_uri,
        "token_uri": settings.firebase_token_uri,
        "auth_provider_x509_cert_url": settings.firebase_auth_provider_x509_cert_url,
        "client_x509_cert_url": settings.firebase_client_x509_cert_url
    }

    # Initialize Firebase Admin SDK
    cred = credentials.Certificate(firebase_creds)
    firebase_admin.initialize_app(cred, {
        'storageBucket': settings.firebase_storage_bucket
    })
    
    print("Firebase initialized successfully")


# Initialize Firebase
initialize_firebase()

# Get Firestore client
db = firestore.client()

# Get Storage bucket
storage_bucket = storage.bucket()


class FirestoreDB:
    def __init__(self):
        self.db = None
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK with service account credentials"""
        try:
            # Create service account credentials
            cred_dict = {
                "type": "service_account",
                "project_id": settings.firebase_project_id,
                "private_key_id": settings.firebase_private_key_id,
                "private_key": settings.firebase_private_key.replace('\\n', '\n'),
                "client_email": settings.firebase_client_email,
                "client_id": settings.firebase_client_id,
                "auth_uri": settings.firebase_auth_uri,
                "token_uri": settings.firebase_token_uri,
                "auth_provider_x509_cert_url": settings.firebase_auth_provider_x509_cert_url,
                "client_x509_cert_url": settings.firebase_client_x509_cert_url
            }
            
            cred = credentials.Certificate(cred_dict)
            
            # Initialize Firebase Admin SDK
            firebase_admin.initialize_app(cred)
            
            # Get Firestore client
            self.db = firestore.client()
            
        except Exception as e:
            print(f"Error initializing Firebase: {e}")
            raise
    
    def _serialize_datetime(self, obj: Any) -> Any:
        """Convert datetime objects to ISO format strings for Firestore"""
        if isinstance(obj, datetime):
            return obj.isoformat()
        return obj
    
    def _deserialize_datetime(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert ISO format strings back to datetime objects"""
        for key, value in data.items():
            if isinstance(value, str) and key in ['createdAt', 'updatedAt', 'date']:
                try:
                    data[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                except ValueError:
                    pass
        return data
    
    async def create_document(self, collection: str, data: Dict[str, Any]) -> str:
        """Create a new document in Firestore"""
        try:
            # Serialize datetime objects
            serialized_data = {k: self._serialize_datetime(v) for k, v in data.items()}
            
            # Add timestamps
            serialized_data['createdAt'] = datetime.utcnow().isoformat()
            serialized_data['updatedAt'] = datetime.utcnow().isoformat()
            
            # Create document
            doc_ref = self.db.collection(collection).document()
            doc_ref.set(serialized_data)
            
            return doc_ref.id
            
        except Exception as e:
            print(f"Error creating document in {collection}: {e}")
            raise
    
    async def get_document(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get a document by ID"""
        try:
            doc_ref = self.db.collection(collection).document(doc_id)
            doc = doc_ref.get()
            
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                return self._deserialize_datetime(data)
            
            return None
            
        except Exception as e:
            print(f"Error getting document {doc_id} from {collection}: {e}")
            raise
    
    async def update_document(self, collection: str, doc_id: str, data: Dict[str, Any]) -> bool:
        """Update a document in Firestore"""
        try:
            # Serialize datetime objects
            serialized_data = {k: self._serialize_datetime(v) for k, v in data.items()}
            
            # Add updated timestamp
            serialized_data['updatedAt'] = datetime.utcnow().isoformat()
            
            # Update document
            doc_ref = self.db.collection(collection).document(doc_id)
            doc_ref.update(serialized_data)
            
            return True
            
        except Exception as e:
            print(f"Error updating document {doc_id} in {collection}: {e}")
            raise
    
    async def delete_document(self, collection: str, doc_id: str) -> bool:
        """Delete a document from Firestore"""
        try:
            doc_ref = self.db.collection(collection).document(doc_id)
            doc_ref.delete()
            return True
            
        except Exception as e:
            print(f"Error deleting document {doc_id} from {collection}: {e}")
            raise
    
    async def query_documents(self, collection: str, filters: Optional[List[tuple]] = None, 
                            order_by: Optional[str] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Query documents with filters and ordering"""
        try:
            query = self.db.collection(collection)
            
            # Apply filters
            if filters:
                for field, operator, value in filters:
                    query = query.where(field, operator, value)
            
            # Apply ordering
            if order_by:
                query = query.order_by(order_by)
            
            # Apply limit
            if limit:
                query = query.limit(limit)
            
            # Execute query
            docs = query.stream()
            
            # Convert to list of dictionaries
            results = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                results.append(self._deserialize_datetime(data))
            
            return results
            
        except Exception as e:
            print(f"Error querying documents from {collection}: {e}")
            raise
    
    async def get_document_by_field(self, collection: str, field: str, value: Any) -> Optional[Dict[str, Any]]:
        """Get a document by a specific field value"""
        try:
            query = self.db.collection(collection).where(field, "==", value).limit(1)
            docs = query.stream()
            
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                return self._deserialize_datetime(data)
            
            return None
            
        except Exception as e:
            print(f"Error getting document by field {field}={value} from {collection}: {e}")
            raise
    
    async def count_documents(self, collection: str, filters: Optional[List[tuple]] = None) -> int:
        """Count documents in a collection with optional filters"""
        try:
            query = self.db.collection(collection)
            
            # Apply filters
            if filters:
                for field, operator, value in filters:
                    query = query.where(field, operator, value)
            
            # Get documents and count
            docs = query.stream()
            return len(list(docs))
            
        except Exception as e:
            print(f"Error counting documents in {collection}: {e}")
            raise


# Create global database instance
db = FirestoreDB() 