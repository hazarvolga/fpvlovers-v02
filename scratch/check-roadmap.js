const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  const response = await page.goto('http://localhost:3001/academy/roadmap');
  console.log('Status:', response.status());
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
