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

  // Try IPv4 host first to avoid IPv6/localhost resolution issues, then fall back to localhost
  const targets = ['http://127.0.0.1:3000', 'http://localhost:3000'];
  let navigated = false;
  for (const t of targets) {
    try {
      await page.goto(t, { waitUntil: 'networkidle', timeout: 10000 });
      navigated = true;
      break;
    } catch (e) {
      console.error(`Navigation error to ${t}:`, e.message);
      logs.push(`Navigation error to ${t}: ` + e.message);
    }
  }
  if (!navigated) {
    console.error('Navigation error: all targets failed — falling back to local file load');
    logs.push('Navigation error: all targets failed');
    try {
      const indexPath = path.resolve(__dirname, '..', 'frontend', 'index.html');
      if (fs.existsSync(indexPath)) {
        const html = fs.readFileSync(indexPath, 'utf8');
        // set a base so relative assets resolve when possible
        const baseHtml = html.replace(/<head>/i, '<head><base href="http://127.0.0.1:3000/">');
        await page.setContent(baseHtml, { waitUntil: 'networkidle' });
        console.log('Loaded frontend from local file as fallback.');
      } else {
        console.error('Local index.html not found:', indexPath);
      }
    } catch (e) {
      console.error('Fallback file load failed:', e.message);
      logs.push('Fallback file load failed: ' + e.message);
    }
  }

  // give the page some time to run scripts
  await page.waitForTimeout(1000);

  const screenshotPath = path.join(outDir, 'frontend_screenshot.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  fs.writeFileSync(path.join(outDir, 'frontend_console.log'), logs.join('\n'));

  console.log('Saved screenshot to', screenshotPath);
  await browser.close();
})();
