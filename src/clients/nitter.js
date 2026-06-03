const xml2js = require('xml2js');
const fs = require('fs');

// Spoofing a real browser User-Agent is required — without it these instances return 403
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  'Accept-Language': 'en-US,en;q=0.9',
};

// xcancel is a Nitter-compatible mirror that still serves RSS with a browser User-Agent
const NITTER_INSTANCES = [
  'https://xcancel.com',
  'https://nitter.poast.org',
  'https://nitter.net',
];

const SENT_IDS_FILE = 'sent_ids.json';

async function fetchTweets(config) {
  const { TARGET_ACCOUNT, KEYWORDS, CHECK_INTERVAL_MS } = config;

  try {
    const items = await fetchRSS(TARGET_ACCOUNT);
    if(items){
      return items
    }

    return "Nothing returned with no error"
  } catch (err) {
    console.error('Error fetching tweets:', err.message || err);
    return "Nothing Found"
  }
}

// TODO: Add recovery on failure
// Try each Nitter instance until one works
async function fetchRSS(targetAccount) {
  for (const instance of NITTER_INSTANCES) {
    const url = `${instance}/${targetAccount}/rss`;
    try {
      const res = await fetch(url, { headers: BROWSER_HEADERS, timeout: 10000 });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      const parsed = await xml2js.parseStringPromise(xml, { explicitArray: false });
      const items = parsed?.rss?.channel?.item;
      if (!items) throw new Error('No items in feed');
      console.log(`✅ Fetched RSS from ${instance}`);
      return Array.isArray(items) ? items : [items];
    } catch (err) {
      console.warn(`⚠️  ${instance} failed: ${err.message} — trying next...`);
    }
  }
  throw new Error('All Nitter instances failed.');
}

module.exports = { fetchTweets };