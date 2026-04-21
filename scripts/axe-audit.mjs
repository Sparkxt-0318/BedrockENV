import puppeteer from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';

const url = process.argv[2] || 'http://localhost:3000/intelligence/flood-contamination';

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
page.setDefaultNavigationTimeout(60000);

const consoleErrors = [];
page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(`console: ${msg.text()}`);
});

await page.goto(url, { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1500));

const results = await new AxePuppeteer(page)
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  .analyze();

console.log(JSON.stringify({
  url,
  violations: results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.length,
    sampleTarget: v.nodes[0]?.target,
    sampleHtml: v.nodes[0]?.html?.slice(0, 200),
  })),
  passes: results.passes.length,
  incomplete: results.incomplete.map((v) => ({ id: v.id, nodes: v.nodes.length })),
  consoleErrors,
}, null, 2));

await browser.close();
