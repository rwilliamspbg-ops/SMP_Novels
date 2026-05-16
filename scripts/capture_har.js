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
    const text = `[console:${msg.type()}] ${msg.text()}`;
    console.log(text);
    logs.push(text);
  });
  page.on('pageerror', err => {
    const text = `[pageerror] ${err.message}`;
    console.error(text);
    logs.push(text);
  });

  const network = [];

  page.on('request', req => {
    try {
      network.push({
        id: `${network.length}-${Date.now()}`,
        url: req.url(),
        method: req.method(),
        headers: req.headers(),
        postData: req.postData(),
        startTime: Date.now(),
        status: null,
        statusText: null,
        responseHeaders: null,
        responseBody: null
      });
    } catch (e) {
      logs.push('[request event error] ' + e.message);
    }
  });

  page.on('response', async res => {
    try {
      const req = res.request();
      // try to match by url + method (best-effort)
      const entry = network.find(e => e.url === req.url() && e.method === req.method() && e.status === null);
      const txt = await res.text().catch(() => null);
      if (entry) {
        entry.status = res.status();
        entry.statusText = res.statusText();
        entry.responseHeaders = res.headers();
        if (txt && txt.length > 20000) entry.responseBody = txt.slice(0, 20000) + '\n...[truncated]';
        else entry.responseBody = txt;
        entry.endTime = Date.now();
      } else {
        network.push({
          id: `${network.length}-${Date.now()}`,
          url: req.url(),
          method: req.method(),
          headers: req.headers(),
          postData: req.postData(),
          startTime: Date.now(),
          status: res.status(),
          statusText: res.statusText(),
          responseHeaders: res.headers(),
          responseBody: txt,
          endTime: Date.now()
        });
      }
    } catch (e) {
      logs.push('[response event error] ' + e.message);
    }
  });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 20000 });
  } catch (e) {
    const msg = 'Navigation error: ' + e.message;
    console.error(msg);
    logs.push(msg);
  }

  // give the page some time to run scripts and lazy requests
  await page.waitForTimeout(2500);

  const outPrefix = path.join(outDir, 'frontend');
  const screenshotPath = outPrefix + '_screenshot.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  fs.writeFileSync(path.join(outDir, 'frontend_console.log'), logs.join('\n'));
  fs.writeFileSync(path.join(outDir, 'frontend_network.json'), JSON.stringify(network, null, 2));

  console.log('Saved screenshot to', screenshotPath);
  console.log('Saved console log and network JSON to', outDir);
  await browser.close();
} )().catch(err => {
  console.error('Capture failed:', err && err.message || err);
  process.exit(2);
});
