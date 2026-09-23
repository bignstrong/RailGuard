#!/usr/bin/env node

const SITE_URL = 'https://railguard.ru';
const INDEX_NOW_KEY = process.env.INDEXNOW_KEY;

if (!INDEX_NOW_KEY) {
  console.error('Error: INDEXNOW_KEY environment variable is not set');
  process.exit(1);
}

async function fetchSitemap() {
  try {
    const response = await fetch(`${SITE_URL}/sitemap.xml`);
    const xml = await response.text();

    const urlRegex = /<loc>([^<]+)<\/loc>/g;
    const urls = [];
    let match;

    while ((match = urlRegex.exec(xml)) !== null) {
      urls.push(match[1]);
    }

    return urls;
  } catch (err) {
    console.error('Error fetching sitemap:', err.message);
    process.exit(1);
  }
}

async function submitToIndexNow(urls) {
  const endpoints = [
    'https://yandex.com/indexnow',
    'https://api.indexnow.org/indexnow',
  ];

  const payload = {
    host: SITE_URL.replace(/https?:\/\//, ''),
    key: INDEX_NOW_KEY,
    keyLocation: `${SITE_URL}/indexnow-key.txt`,
    urlList: urls,
  };

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`✓ Successfully submitted to ${endpoint}`);
      } else {
        console.warn(`✗ ${endpoint}: HTTP ${response.status}`);
      }
    } catch (err) {
      console.error(`✗ Error submitting to ${endpoint}:`, err.message);
    }
  }
}

async function main() {
  console.log('Fetching sitemap...');
  const urls = await fetchSitemap();
  console.log(`Found ${urls.length} URLs`);

  console.log('Submitting to IndexNow...');
  await submitToIndexNow(urls);
  console.log('Done');
}

main();
