const fetch  = require('node-fetch');
const xml2js = require('xml2js');
const fs     = require('fs');

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

// const TEST_TIME = 24 * 60 * 60 * 1000;

// TODO: Reduce function complexity
async function fetchAndFilter(waClient, groupChatId, config) {
  const { TARGET_ACCOUNT, KEYWORDS, CHECK_INTERVAL_MS } = config;

  console.log(`[${new Date().toLocaleTimeString()}] Checking @${TARGET_ACCOUNT} for new tweets...`);

  try {
    const items   = await fetchRSS(TARGET_ACCOUNT);
    const sentIds = loadSentIds();

    // Send new valid messages in reverse order of time
    const toSend = items
      .slice()
      .reverse()
      .filter(item => {
        const id      = extractTweetId(item.link);
        const pubDate = item.pubDate;
        const text    = stripHtml(item.description || item.title || '');

        if (!isRecent(pubDate, CHECK_INTERVAL_MS)) {
          console.log(`⏩ Skipping ${id} — not posted in the last ${CHECK_INTERVAL_MS / 60 * 1000} mins.`);
          return false;
        }
        if (sentIds.has(id)) {
          console.log(`⏩ Skipping ${id} — already sent.`);
          return false;
        }
        if (!matchesFilter(text, KEYWORDS)) {
          console.log(`⏩ Skipping ${id} — no keyword match.`);
          return false;
        }
        return true;
      });

    if (toSend.length === 0) {
      console.log('No new matching tweets to send.');
      return;
    }

    for (const item of toSend) {
      const id   = extractTweetId(item.link);
      const text = stripHtml(item.description || item.title || '');
      const link = toXLink(item.link);
      const msg  = formatMessage(text, link);

      await waClient.sendMessage(groupChatId, msg);
      sentIds.add(id);
      console.log(`✅ Sent tweet ${id} to WhatsApp group.`);
      await new Promise(r => setTimeout(r, 2000));
    }

    saveSentIds(sentIds);

  } catch (err) {
    console.error('Error fetching tweets:', err.message || err);
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

// TODO: Fix implementation
function loadSentIds() {
  try {
    const data = fs.readFileSync(SENT_IDS_FILE, 'utf8');
    return new Set(JSON.parse(data));
  } catch {
    return new Set();
  }
}

// TODO: Fix implementation
function saveSentIds(sentIds) {
  const trimmed = [...sentIds].slice(-500);
  fs.writeFileSync(SENT_IDS_FILE, JSON.stringify(trimmed), 'utf8');
}

// Extract tweet ID from the Nitter RSS item link
function extractTweetId(link) {
  const match = link.match(/\/status\/(\d+)/);
  return match ? match[1] : link;
}

// Strip HTML tags from RSS description
function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

// Replace Nitter link with real X link
function toXLink(link) {
  return link
    .replace(/https?:\/\/[^/]+/, 'https://x.com')
    .replace(/#m$/, '');
}

// Check if tweet matches any keyword (case-insensitive)
function matchesFilter(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

// Check if tweet was posted within the last CHECK_INTERVAL_MS window
function isRecent(pubDate, CHECK_INTERVAL_MS) {
  const tweetTime = new Date(pubDate).getTime();
  const cutoff    = Date.now() - CHECK_INTERVAL_MS;
  return tweetTime >= cutoff;
}

// Format into a clean WhatsApp message
function formatMessage(text, xLink) {
  return `📰 *News Update*\n\n${text}\n\n🔗 ${xLink}`;
}

module.exports = { fetchAndFilter };