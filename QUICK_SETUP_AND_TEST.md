# Quick Setup & Test Guide

## 🚨 Issue Found

Your `.env.local` file exists but is **missing `FIREBASE_SERVICE_ACCOUNT_KEY`**. This is why event creation hangs - Firebase Admin SDK can't write to Firestore without it.

## ✅ Step-by-Step Fix

### 1. Get Firebase Service Account Key

1. Go to: https://console.firebase.google.com/
2. Select project: **satrf-website**
3. Click ⚙️ **Settings** → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the JSON file (it downloads automatically)

### 2. Add to `.env.local`

Open your `.env.local` file and add this line:

```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"satrf-website","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@satrf-website.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

**Important:**
- Copy the **entire JSON** from the downloaded file
- Put it on **one line** (remove all line breaks)
- Keep it as valid JSON

### 3. Start Your Servers

You need **both** servers running:

**Terminal 1 - Backend (FastAPI):**
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend (Next.js):**
```bash
pnpm dev
```

### 4. Test Everything

Once both servers are running, I'll test it for you using your credentials.

Or run the test script:
```bash
node test-event-creation.js
```

## 🔍 What the Test Will Check

1. ✅ Firebase Admin SDK is configured
2. ✅ Login works with your credentials
3. ✅ Firebase connection is working
4. ✅ Event creation works end-to-end

## 📝 Current Status

- ❌ `FIREBASE_SERVICE_ACCOUNT_KEY` missing from `.env.local`
- ❌ Dev server not running
- ⏳ Waiting for setup to complete testing








