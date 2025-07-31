# SATRF Website Production Deployment Guide

This guide covers the complete production deployment process for the SATRF website, including frontend, backend, and domain configuration.

## 🚀 Quick Start

1. **Environment Setup** - Configure production environment variables
2. **Frontend Deployment** - Deploy to Vercel
3. **Backend Deployment** - Deploy to Render/Railway/Google Cloud Run
4. **Domain Configuration** - Set up custom domain and HTTPS
5. **Post-Deployment** - Verify and monitor

## 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Docker (for backend deployment)
- Git repository access
- Domain name (optional but recommended)

## 🔧 1. Environment Setup

### Frontend Environment Variables

Create `.env.production` file in the root directory:

```bash
# Copy the example file
cp env.production.example .env.production

# Edit with your production values
nano .env.production
```

**Required Variables:**
- `NEXT_PUBLIC_API_BASE_URL` - Your backend API URL
- `NEXT_PUBLIC_FIREBASE_*` - Firebase configuration
- `NEXT_PUBLIC_APP_URL` - Your frontend domain

### Backend Environment Variables

Create `.env` file in the `backend/` directory:

```bash
# Copy the example file
cd backend
cp env.production.example .env

# Edit with your production values
nano .env
```

**Required Variables:**
- `SECRET_KEY` - Strong random string for JWT tokens
- `FIREBASE_*` - Firebase service account credentials
- `SENDGRID_API_KEY` - Email service API key
- `ALLOWED_ORIGINS` - Your frontend domain(s)

## 🌐 2. Frontend Deployment (Vercel)

### Option A: Vercel CLI Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
./deploy-frontend.sh
```

### Option B: GitHub Integration

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push

### Vercel Configuration

**Build Settings:**
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm ci`

**Environment Variables:**
Add all variables from `.env.production` to Vercel dashboard.

## 🔧 3. Backend Deployment

### Option A: Render (Recommended)

1. **Create Render Account**
   - Sign up at [render.com](https://render.com)

2. **Deploy Backend Service**
   ```bash
   # Use the deployment script
   ./deploy-backend.sh render
   ```

3. **Manual Deployment Steps:**
   - Create new Web Service
   - Connect your GitHub repository
   - Set build command: `pip install -r requirements.txt`
   - Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Add environment variables from backend `.env`

### Option B: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy
./deploy-backend.sh railway
```

### Option C: Google Cloud Run

```bash
# Install Google Cloud CLI
# Follow: https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Deploy
./deploy-backend.sh gcp
```

### Option D: Docker Local Testing

```bash
# Test locally with Docker
./deploy-backend.sh docker
```

## 🌍 4. Domain Configuration

### Custom Domain Setup

1. **Purchase Domain** (if not already owned)
   - Recommended: Namecheap, GoDaddy, or Google Domains

2. **DNS Configuration**
   ```
   # Frontend (Vercel)
   Type: CNAME
   Name: @
   Value: your-app.vercel.app
   
   # Backend (if using custom domain)
   Type: CNAME
   Name: api
   Value: your-backend-url.com
   ```

3. **Vercel Domain Configuration**
   - Go to Vercel Dashboard → Your Project → Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed

4. **SSL/HTTPS**
   - Vercel provides automatic SSL certificates
   - Backend platforms (Render/Railway) provide automatic HTTPS

### Environment Variable Updates

After setting up custom domains, update:

**Frontend (.env.production):**
```bash
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Backend (.env):**
```bash
ALLOWED_ORIGINS=["https://yourdomain.com", "https://www.yourdomain.com"]
```

## ✅ 5. Post-Deployment Verification

### Health Checks

1. **Frontend Health Check:**
   ```bash
   curl -I https://yourdomain.com
   ```

2. **Backend Health Check:**
   ```bash
   curl -I https://api.yourdomain.com/health
   ```

3. **API Endpoints Test:**
   ```bash
   # Test registration endpoint
   curl -X POST https://api.yourdomain.com/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"testpass"}'
   ```

### Performance Testing

1. **Lighthouse Audit:**
   - Run Lighthouse in Chrome DevTools
   - Target: 90+ for all metrics

2. **Load Testing:**
   ```bash
   # Install k6 for load testing
   npm install -g k6
   
   # Run load test
   k6 run load-test.js
   ```

### Security Verification

1. **Security Headers:**
   ```bash
   curl -I https://yourdomain.com
   # Verify security headers are present
   ```

2. **CORS Configuration:**
   - Test API calls from frontend
   - Verify CORS errors are resolved

## 📊 6. Monitoring and Maintenance

### Monitoring Setup

1. **Vercel Analytics** (Frontend)
   - Enable in Vercel dashboard
   - Monitor performance metrics

2. **Backend Monitoring**
   - Render/Railway provide built-in monitoring
   - Set up alerts for downtime

3. **Error Tracking**
   - Consider Sentry for error monitoring
   - Add to environment variables

### Regular Maintenance

1. **Dependency Updates:**
   ```bash
   # Frontend
   npm audit fix
   npm update
   
   # Backend
   pip list --outdated
   pip install -r requirements.txt --upgrade
   ```

2. **Database Backups:**
   - Firebase provides automatic backups
   - Monitor storage usage

3. **Security Updates:**
   - Regular security audits
   - Update dependencies with security patches

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check environment variables
   - Verify dependency versions
   - Review build logs

2. **CORS Errors:**
   - Verify `ALLOWED_ORIGINS` in backend
   - Check frontend API URL configuration

3. **Authentication Issues:**
   - Verify Firebase configuration
   - Check JWT secret key

4. **File Upload Issues:**
   - Verify Firebase Storage configuration
   - Check file size limits

### Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Firebase Documentation](https://firebase.google.com/docs)

## 📞 Contact

For deployment support or issues:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting section above

---

**Last Updated:** July 2024
**Version:** 1.0.0 