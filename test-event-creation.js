/**
 * Test script to diagnose event creation issues
 * Run with: node test-event-creation.js
 */

const https = require('https');
const http = require('http');

const email = 'techaim10.9@gmail.com';
const password = 'Ballas1994#';

async function testFirebaseConnection() {
  console.log('🔍 Testing Firebase Admin SDK connection...\n');
  
  // Check if .env.local exists and has FIREBASE_SERVICE_ACCOUNT_KEY
  const fs = require('fs');
  const path = require('path');
  
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasServiceAccount = envContent.includes('FIREBASE_SERVICE_ACCOUNT_KEY');
    console.log('✅ .env.local file exists');
    console.log(hasServiceAccount ? '✅ FIREBASE_SERVICE_ACCOUNT_KEY found' : '❌ FIREBASE_SERVICE_ACCOUNT_KEY NOT FOUND');
    
    if (!hasServiceAccount) {
      console.log('\n⚠️  This is likely the issue!');
      console.log('   You need to add FIREBASE_SERVICE_ACCOUNT_KEY to .env.local');
      console.log('   See FIREBASE_ADMIN_SETUP.md for instructions\n');
    }
  } else {
    console.log('❌ .env.local file NOT FOUND');
    console.log('   Create .env.local and add FIREBASE_SERVICE_ACCOUNT_KEY\n');
  }
}

async function testLogin(baseUrl) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔐 Testing login at ${baseUrl}/api/auth/login...\n`);
    
    const postData = JSON.stringify({ email, password });
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    };
    
    const req = http.request(`${baseUrl}/api/auth/login`, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log('✅ Login successful!');
            console.log('   Token received:', json.access_token ? 'Yes' : 'No');
            resolve(json.access_token);
          } catch (e) {
            console.log('❌ Failed to parse login response');
            reject(e);
          }
        } else {
          console.log(`❌ Login failed: ${res.statusCode}`);
          console.log('   Response:', data);
          reject(new Error(`Login failed: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Connection error: ${error.message}`);
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log('❌ Request timeout');
      reject(new Error('Request timeout'));
    });
    
    req.write(postData);
    req.end();
  });
}

async function testFirebaseEndpoint(baseUrl, token) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔥 Testing Firebase Admin endpoint at ${baseUrl}/api/admin/test-firebase...\n`);
    
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    };
    
    const req = http.request(`${baseUrl}/api/admin/test-firebase`, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('📊 Firebase Test Result:');
          console.log('   Status:', json.status);
          console.log('   Message:', json.message);
          console.log('   Initialization Method:', json.initializationMethod || 'N/A');
          console.log('   Service Account Provided:', json.serviceAccountKeyProvided || false);
          
          if (json.status === 'success') {
            console.log('\n✅ Firebase Admin SDK is working!');
            resolve(true);
          } else {
            console.log('\n❌ Firebase Admin SDK has issues');
            console.log('   Details:', json.details || 'N/A');
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Failed to parse response');
          console.log('   Raw response:', data);
          reject(e);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Connection error: ${error.message}`);
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log('❌ Request timeout');
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function testEventCreation(baseUrl, token) {
  return new Promise((resolve, reject) => {
    console.log(`\n📅 Testing event creation at ${baseUrl}/api/admin/events...\n`);
    
    const eventData = {
      title: 'Test Event - ' + new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      location: 'Test Range',
      type: 'Test Match',
      description: 'This is a test event',
      status: 'open',
      maxParticipants: 50
    };
    
    const postData = JSON.stringify(eventData);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000 // 30 seconds
    };
    
    console.log('📤 Sending event data:', JSON.stringify(eventData, null, 2));
    
    const req = http.request(`${baseUrl}/api/admin/events`, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          
          if (res.statusCode === 201 || res.statusCode === 200) {
            console.log('✅ Event created successfully!');
            console.log('   Event ID:', json.id || json.event?.id || 'N/A');
            console.log('   Response:', JSON.stringify(json, null, 2));
            resolve(true);
          } else {
            console.log(`❌ Event creation failed: ${res.statusCode}`);
            console.log('   Error:', json.error || 'Unknown error');
            console.log('   Details:', json.details || 'N/A');
            console.log('   Full response:', JSON.stringify(json, null, 2));
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Failed to parse response');
          console.log('   Raw response:', data);
          console.log('   Status code:', res.statusCode);
          reject(e);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Connection error: ${error.message}`);
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log('❌ Request timeout (30s) - this suggests Firebase Admin SDK is not initialized');
      reject(new Error('Request timeout'));
    });
    
    req.write(postData);
    req.end();
  });
}

async function main() {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  
  console.log('🧪 Event Creation Diagnostic Test\n');
  console.log('='.repeat(50));
  console.log(`Testing against: ${baseUrl}`);
  console.log('='.repeat(50));
  
  // Step 1: Check environment setup
  await testFirebaseConnection();
  
  // Step 2: Test login
  let token;
  try {
    token = await testLogin(baseUrl);
  } catch (error) {
    console.log('\n❌ Cannot proceed without login. Make sure:');
    console.log('   1. Dev server is running (pnpm dev)');
    console.log('   2. Login endpoint is working');
    process.exit(1);
  }
  
  // Step 3: Test Firebase Admin SDK
  const firebaseWorking = await testFirebaseEndpoint(baseUrl, token);
  
  if (!firebaseWorking) {
    console.log('\n⚠️  Firebase Admin SDK is not working properly.');
    console.log('   This will cause event creation to hang.');
    console.log('   Fix the Firebase setup before testing event creation.');
    process.exit(1);
  }
  
  // Step 4: Test event creation
  await testEventCreation(baseUrl, token);
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Diagnostic test complete!');
  console.log('='.repeat(50));
}

main().catch(console.error);








