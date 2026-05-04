const fs = require('fs');
const { getKafkaClient } = require('../clients/kafka')

const producer = getKafkaClient().producer();
const rawTweetsTopic = "tweets_raw"
const SENT_IDS_FILE = 'sent_ids.json';

async function produceMessage(rawTweets) {
  const messages = await processTweets(rawTweets) 

  // Production of messages
  try {
    await producer.connect();
    await producer.send({
      topic: rawTweetsTopic,
      messages: messages,
    });

    console.log('Message sent');
  } catch (error) {
    console.log("Failed to produce raw tweets")
    console.log(error)
    await producer.disconnect();
    return false
  }

  await producer.disconnect();
  return true
}


async function processTweets(rawTweets) {
  const sentIds = loadPrevSentIds();
  let messages  = []

  for (const tweet of rawTweets) {
    const id = extractTweetId(tweet)

    messages.push(await buildMessage(tweet))

    // TODO: Cache with redis
    sentIds.add(id);
    await new Promise(r => setTimeout(r, 2000));
  }

  await saveSentIds(sentIds);
  return messages
}

async function buildMessage(rawTweet) {
  const id = extractTweetId(rawTweet)
  const channel = rawTweet.creator

  return {
      key: rawTweet.creator + '-' + id,
      value: JSON.stringify({
        tweetId: id,
        channel: rawTweet.creator,
        title: rawTweet.title,
        body: stripHtml(rawTweet.description),
        dateOfPost: rawTweet.pubDate,
        extraLinks: rawTweet.links,
        createdAt: new Date().toISOString()
      })
    }
}

// TODO: Fix implementation
function loadPrevSentIds() {
  try {
    const data = fs.readFileSync(SENT_IDS_FILE, 'utf8');
    return new Set(JSON.parse(data));
  } catch {
    console.log("Failed to read sent_ids.json")
    return new Set();
  }
}

// TODO: Fix implementation
async function saveSentIds(sentIds) {
  if(!sentIds) {
    console.log("No IDs to save");
    return
  }

  const trimmed = [...sentIds].slice(-500);
  fs.writeFileSync(SENT_IDS_FILE, JSON.stringify(trimmed), 'utf8');
}

// Extract tweet ID from the Nitter RSS item link if guid body not found
function extractTweetId(tweet) {
  return tweet.guid?._ || tweet.link.match(/\/status\/(\d+)/)?.[1];
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
  const cutoff    = Date.now() - TEST_TIME;
  return tweetTime >= cutoff;
}

// Format into a clean WhatsApp message
function formatMessage(text, xLink) {
  return `📰 *News Update*\n\n${text}\n\n🔗 ${xLink}`;
}

module.exports = {
  produceMessage
}