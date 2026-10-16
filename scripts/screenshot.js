const puppeteer = require('puppeteer');

const pages = [
  { name: 'dashboard', url: 'http://localhost:3000', waitFor: 3000 },
  { name: 'candidates', url: 'http://localhost:3000/candidates', waitFor: 2000 },
  { name: 'add-candidate', url: 'http://localhost:3000/candidates/new', waitFor: 1500 },
  { name: 'pipeline', url: 'http://localhost:3000/pipeline', waitFor: 3000 },
];

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox'],
  });

  for (const page of pages) {
    console.log(`📸 Capturing ${page.name}...`);
    const tab = await browser.newPage();
    await tab.goto(page.url, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, page.waitFor));
    await tab.screenshot({
      path: `public/screenshots/${page.name}.png`,
      fullPage: page.name === 'dashboard',
    });
    await tab.close();
    console.log(`✅ ${page.name}.png saved`);
  }

  await browser.close();
  console.log('🎉 All screenshots captured!');
})();
