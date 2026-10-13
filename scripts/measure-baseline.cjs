// Measurement tooling is supplied externally; no application dependency is added.
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const root = path.resolve(__dirname, '..');
const output = path.join(root, process.env.MEASUREMENT_OUTPUT || 'optimized-results');
fs.mkdirSync(output, { recursive: true });
const tooling = process.env.BASELINE_TOOLS;
if (!tooling) throw new Error('Set BASELINE_TOOLS to the directory containing lighthouse and puppeteer-core.');
const puppeteer = require(path.join(tooling, 'puppeteer-core'));
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
(async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--remote-debugging-port=0'], protocolTimeout: 600000 });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(600000);
    await page.setViewport({ width: 1365, height: 768 });
    const mode = process.argv[2];
    const url = `http://localhost:${mode === 'profiler' ? 8000 : 8001}/dashboard/?benchmark=10000`;
    if (mode === 'profiler') {
      await page.evaluateOnNewDocument(() => {
        window.__baselineCommits = [];
        window.addEventListener('assignment-profiler', e => window.__baselineCommits.push(e.detail));
      });
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 600000 });
      await page.waitForFunction(() => document.querySelector('[data-total-count="10000"]') && document.querySelectorAll('.assignment-card').length > 0);
      await new Promise(r => setTimeout(r, 4000));
      const results = { url, browser: await browser.version(), node: process.version, mode: 'development React.Profiler + existing render-body counter', runs: [] };
      for (let run = 1; run <= 3; run++) {
        const input = await page.$('input[aria-label="Tìm kiếm bài tập"]');
        await input.click();
        await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control');
        await page.keyboard.press('Backspace');
        await new Promise(r => setTimeout(r, 1500));
        await page.evaluate(() => { window.__baselineCommits = []; });
        await input.type('0');
        await new Promise(r => setTimeout(r, 2000));
        const result = await page.evaluate(() => ({ query: document.querySelector('input[aria-label="Tìm kiếm bài tập"]').value, cards: document.querySelectorAll('.assignment-card').length, counter: document.querySelector('.stress-render-count').textContent, commits: window.__baselineCommits }));
        if (result.cards < 1 || result.cards > 20 || !result.commits.length) throw new Error('Invalid profiler measurement: ' + JSON.stringify(result));
        results.runs.push({ run, ...result });
      }
      await page.screenshot({ path: path.join(output, 'profiler.png') });
      fs.writeFileSync(path.join(output, 'profiler.json'), JSON.stringify(results, null, 2));
      console.log(JSON.stringify(results, null, 2));
    } else {
      const { default: lighthouse } = await import(pathToFileURL(path.join(tooling, 'lighthouse/core/index.js')).href);
      const port = Number(new URL(browser.wsEndpoint()).port);
      const summary = [];
      for (let run = 1; run <= 3; run++) {
        const result = await lighthouse(url, { port, output: ['json', 'html'], onlyCategories: ['performance'], formFactor: 'mobile', maxWaitForLoad: 180000 }, undefined, page);
        fs.writeFileSync(path.join(output, `lighthouse-${run}.json`), result.report[0]);
        fs.writeFileSync(path.join(output, `lighthouse-${run}.html`), result.report[1]);
        const pages = await browser.pages();
        let count = null;
        for (const p of pages) if (p.url().includes('benchmark=10000')) count = await p.evaluate(() => Number(document.querySelector('[data-total-count]')?.getAttribute('data-total-count')));
        const item = { run, cardsAfterAudit: count, score: result.lhr.categories.performance.score, runtimeError: result.lhr.runtimeError, warnings: result.lhr.runWarnings };
        summary.push(item);
        console.log(JSON.stringify(item));
        fs.writeFileSync(path.join(output, 'lighthouse-summary.json'), JSON.stringify(summary, null, 2));
        if (count !== 10000 || result.lhr.runtimeError) throw new Error('Invalid Lighthouse audit; inspect artifacts.');
      }
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
