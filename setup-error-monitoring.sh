#!/bin/bash

# SATRF Error Monitoring and Feedback System Setup Script
# This script helps set up Sentry integration and contact form system

echo "🚀 Setting up SATRF Error Monitoring and Feedback System"
echo "========================================================"

# Check if running in the correct directory
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Installing frontend dependencies..."
npm install

echo "🐍 Installing backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..

echo "🔧 Setting up environment files..."

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Frontend Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
EOF
    echo "✅ Created .env.local file"
else
    echo "ℹ️  .env.local already exists"
fi

# Create backend .env if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend .env file..."
    cat > backend/.env << EOF
# Application Configuration
DEBUG=True
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=development

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your_service_account_email

# Firebase Storage Configuration
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_STORAGE_BASE_URL=https://storage.googleapis.com

# Email Configuration (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@satrf.org.za
SENDGRID_FROM_NAME=SATRF
SENDGRID_TEMPLATE_ID_REGISTRATION=your_registration_template_id
SENDGRID_TEMPLATE_ID_PASSWORD_RESET=your_password_reset_template_id
SENDGRID_TEMPLATE_ID_EVENT_REMINDER=your_event_reminder_template_id
SENDGRID_TEMPLATE_ID_EVENT_CONFIRMATION=your_event_confirmation_template_id

# Sentry Configuration
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# CORS Configuration
ALLOWED_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
ALLOWED_METHODS=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
ALLOWED_HEADERS=["*"]

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
ALLOWED_FILE_TYPES=["image/jpeg", "image/png", "image/gif", "application/pdf"]

# File Storage Paths
PROFILE_IMAGES_PATH=profile-images
SCORE_DOCUMENTS_PATH=score-documents
EVENT_IMAGES_PATH=event-images

# Database Configuration
FIRESTORE_COLLECTION_USERS=users
FIRESTORE_COLLECTION_EVENTS=events
FIRESTORE_COLLECTION_SCORES=scores
FIRESTORE_COLLECTION_LEADERBOARD=leaderboard
EOF
    echo "✅ Created backend .env file"
else
    echo "ℹ️  backend/.env already exists"
fi

echo ""
echo "🎯 Next Steps:"
echo "=============="
echo ""
echo "1. 📊 Set up Sentry:"
echo "   - Go to https://sentry.io"
echo "   - Create a new account/project"
echo "   - Copy your DSN and update .env files"
echo ""
echo "2. 🔧 Configure Environment Variables:"
echo "   - Update .env.local with your Firebase and Sentry credentials"
echo "   - Update backend/.env with your backend credentials"
echo ""
echo "3. 🚀 Test the Setup:"
echo "   - Start frontend: npm run dev"
echo "   - Start backend: cd backend && python -m uvicorn app.main:app --reload"
echo "   - Visit http://localhost:3000/contact to test the contact form"
echo ""
echo "4. 📚 Read Documentation:"
echo "   - Check ERROR_MONITORING_SETUP.md for detailed instructions"
echo ""
echo "✅ Setup complete! Happy monitoring! 🎉" 