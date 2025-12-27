/**
 * Verify Setup Script
 * Checks if everything is configured correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Setup...\n');
console.log('='.repeat(60));

// Check .env.local exists
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file NOT FOUND');
  console.log('   Create it in the project root directory\n');
  process.exit(1);
}

console.log('✅ .env.local file exists\n');

// Read and check contents
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

console.log('📋 Checking environment variables:\n');

let hasServiceAccount = false;
let hasProjectId = false;
let serviceAccountLine = '';

lines.forEach((line, index) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('FIREBASE_SERVICE_ACCOUNT_KEY')) {
    hasServiceAccount = true;
    serviceAccountLine = trimmed;
    console.log(`✅ Found FIREBASE_SERVICE_ACCOUNT_KEY on line ${index + 1}`);
    
    // Check if it has a value
    const value = trimmed.split('=')[1];
    if (!value || value.trim() === '') {
      console.log('   ⚠️  WARNING: Value appears to be empty!');
    } else if (value.startsWith('"') && value.endsWith('"')) {
      console.log('   ✅ Value is set (quoted)');
      try {
        const jsonValue = JSON.parse(value);
        console.log('   ✅ Value is valid JSON');
        console.log(`   ✅ Project ID in key: ${jsonValue.project_id || 'N/A'}`);
      } catch (e) {
        console.log('   ❌ Value is NOT valid JSON!');
        console.log('   ⚠️  Make sure the entire JSON is on one line');
      }
    } else if (value.startsWith('{')) {
      console.log('   ✅ Value is set (unquoted JSON)');
      try {
        const jsonValue = JSON.parse(value);
        console.log('   ✅ Value is valid JSON');
        console.log(`   ✅ Project ID in key: ${jsonValue.project_id || 'N/A'}`);
      } catch (e) {
        console.log('   ❌ Value is NOT valid JSON!');
        console.log('   ⚠️  Make sure the entire JSON is on one line');
      }
    } else {
      console.log('   ⚠️  Value format unclear - should be JSON');
    }
  }
  
  if (trimmed.startsWith('NEXT_PUBLIC_FIREBASE_PROJECT_ID')) {
    hasProjectId = true;
    console.log(`✅ Found NEXT_PUBLIC_FIREBASE_PROJECT_ID on line ${index + 1}`);
  }
});

console.log('');

if (!hasServiceAccount) {
  console.log('❌ FIREBASE_SERVICE_ACCOUNT_KEY NOT FOUND in .env.local');
  console.log('\n📝 How to add it:');
  console.log('   1. Go to Firebase Console → Project Settings → Service Accounts');
  console.log('   2. Click "Generate New Private Key"');
  console.log('   3. Copy the entire JSON');
  console.log('   4. Add to .env.local as:');
  console.log('      FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}');
  console.log('   5. Make sure it\'s all on ONE line\n');
  process.exit(1);
}

if (!hasProjectId) {
  console.log('⚠️  NEXT_PUBLIC_FIREBASE_PROJECT_ID not found (optional but recommended)');
}

console.log('\n' + '='.repeat(60));
console.log('✅ Environment variables check complete!');
console.log('\n📌 Next steps:');
console.log('   1. Make sure your dev server is running: pnpm dev');
console.log('   2. Make sure your backend is running (if using FastAPI)');
console.log('   3. Restart the dev server after adding env vars');
console.log('   4. Then run: node test-event-creation.js\n');








