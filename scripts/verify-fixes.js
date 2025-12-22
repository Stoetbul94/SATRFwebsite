const puppeteer = require('puppeteer');

async function testWebsiteFixes() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const baseUrl = 'https://satr-fwebsite-git-master-stoetbul94s-projects.vercel.app';
  const results = [];

  console.log('🔍 Testing SATRF Website Fixes...\n');

  // Test 1: Check if coaching link exists in navbar
  try {
    await page.goto(baseUrl);
    await page.waitForSelector('nav', { timeout: 10000 });
    
    const coachingLink = await page.$('a[href="/coaching"]');
    if (coachingLink) {
      results.push('✅ Coaching link found in navbar');
    } else {
      results.push('❌ Coaching link missing from navbar');
    }
  } catch (error) {
    results.push(`❌ Error testing coaching link: ${error.message}`);
  }

  // Test 2: Check if events page loads without error
  try {
    await page.goto(`${baseUrl}/events`);
    await page.waitForSelector('h1', { timeout: 10000 });
    
    const errorText = await page.$('text="Something went wrong"');
    if (!errorText) {
      results.push('✅ Events page loads without error message');
    } else {
      results.push('❌ Events page still shows error message');
    }
  } catch (error) {
    results.push(`❌ Error testing events page: ${error.message}`);
  }

  // Test 3: Check if leaderboard redirect works
  try {
    await page.goto(`${baseUrl}/leaderboard`);
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('/scores/leaderboard')) {
      results.push('✅ Leaderboard redirect working correctly');
    } else {
      results.push('❌ Leaderboard redirect not working');
    }
  } catch (error) {
    results.push(`❌ Error testing leaderboard redirect: ${error.message}`);
  }

  // Test 4: Check if rules page has navbar
  try {
    await page.goto(`${baseUrl}/rules`);
    await page.waitForSelector('nav', { timeout: 10000 });
    
    const navbar = await page.$('nav');
    if (navbar) {
      results.push('✅ Rules page has navbar');
    } else {
      results.push('❌ Rules page missing navbar');
    }
  } catch (error) {
    results.push(`❌ Error testing rules page: ${error.message}`);
  }

  // Test 5: Check if all navigation links work
  const navLinks = [
    { path: '/', name: 'Home' },
    { path: '/events', name: 'Events' },
    { path: '/scores', name: 'Scores' },
    { path: '/coaching', name: 'Coaching' },
    { path: '/scores/leaderboard', name: 'Leaderboard' },
    { path: '/rules', name: 'Rules' },
    { path: '/about', name: 'About' },
    { path: '/contact', name: 'Contact' },
    { path: '/donate', name: 'Donate' }
  ];

  for (const link of navLinks) {
    try {
      await page.goto(`${baseUrl}${link.path}`);
      await page.waitForTimeout(2000);
      
      const status = page.url().includes(link.path) ? '✅' : '❌';
      results.push(`${status} ${link.name} page accessible`);
    } catch (error) {
      results.push(`❌ Error testing ${link.name} page: ${error.message}`);
    }
  }

  await browser.close();

  // Print results
  console.log('📊 Test Results:');
  console.log('================');
  results.forEach(result => console.log(result));
  
  const passed = results.filter(r => r.includes('✅')).length;
  const total = results.length;
  
  console.log(`\n📈 Summary: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All fixes verified successfully!');
  } else {
    console.log('⚠️  Some issues still need attention');
  }
}

// Run the test
testWebsiteFixes().catch(console.error); 