const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const outDir = path.resolve(__dirname, '..', 'artifacts');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    console.log(text);
    logs.push(text);
  });
  page.on('pageerror', err => {
    const text = `[pageerror] ${err.message}`;
    console.error(text);
    logs.push(text);
  });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' , timeout: 10000});
  } catch (e) {
    console.error('Navigation error:', e.message);
    logs.push('Navigation error: ' + e.message);
  }

  // give the page some time to run scripts
  await page.waitForTimeout(1000);

  const screenshotPath = path.join(outDir, 'frontend_screenshot.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  fs.writeFileSync(path.join(outDir, 'frontend_console.log'), logs.join('\n'));

  console.log('Saved screenshot to', screenshotPath);
  await browser.close();
})();
