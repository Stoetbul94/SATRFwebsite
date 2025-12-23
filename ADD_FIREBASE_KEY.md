# 🔑 How to Add FIREBASE_SERVICE_ACCOUNT_KEY

## Current Status
❌ **FIREBASE_SERVICE_ACCOUNT_KEY is MISSING from .env.local**

## Step-by-Step Instructions

### Step 1: Get the Service Account Key

1. **Open Firebase Console:**
   - Go to: https://console.firebase.google.com/
   - Select project: **satrf-website**

2. **Navigate to Service Accounts:**
   - Click the ⚙️ **Settings** icon (top left)
   - Click **Project Settings**
   - Click the **Service Accounts** tab

3. **Generate Key:**
   - Click **Generate New Private Key** button
   - Click **Generate Key** in the popup
   - A JSON file will download automatically

### Step 2: Add to .env.local

1. **Open the downloaded JSON file** (it will be named something like `satrf-website-xxxxx-firebase-adminsdk-xxxxx.json`)

2. **Copy the ENTIRE contents** - it should look like:
   ```json
   {
     "type": "service_account",
     "project_id": "satrf-website",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@satrf-website.iam.gserviceaccount.com",
     "client_id": "...",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     "client_x509_cert_url": "..."
   }
   ```

3. **Open your `.env.local` file** in the project root

4. **Add this line** (replace the JSON with your actual JSON):
   ```env
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"satrf-website","private_key_id":"YOUR_PRIVATE_KEY_ID","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n","client_email":"YOUR_CLIENT_EMAIL","client_id":"YOUR_CLIENT_ID","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"YOUR_CLIENT_X509_CERT_URL"}
   ```

   **IMPORTANT:**
   - Put it all on **ONE LINE** (no line breaks)
   - Keep it as valid JSON
   - Don't add quotes around the entire thing if it's already JSON

### Step 3: Verify It's Added

Run this command to verify:
```bash
node verify-setup.js
```

You should see:
```
✅ Found FIREBASE_SERVICE_ACCOUNT_KEY
✅ Value is valid JSON
```

### Step 4: Restart Dev Server

**IMPORTANT:** After adding the environment variable, you MUST restart your dev server:

1. Stop the current server (Ctrl+C)
2. Start it again:
   ```bash
   pnpm dev
   ```

### Step 5: Test

Once the server is running, I can test it for you, or run:
```bash
node test-event-creation.js
```

## Troubleshooting

### If the JSON is too long for one line:
- That's okay! Just make sure there are no actual line breaks in the middle
- You can use a JSON minifier tool online to make it one line

### If you get "invalid JSON" error:
- Make sure you copied the ENTIRE JSON object
- Make sure there are no extra quotes or characters
- Try wrapping it in quotes: `FIREBASE_SERVICE_ACCOUNT_KEY="{\"type\":\"service_account\",...}"`

### If it still doesn't work:
- Make sure you restarted the dev server after adding the variable
- Check that the file is saved as `.env.local` (not `.env.local.txt`)
- Verify the file is in the project root directory

