const { ConfigSource } = require('kafkajs')
const { getKafkaClient } = require('../clients/kafka')

const filterWorkerGroup = "filter_worker_3"
const consumer = getKafkaClient().consumer({ groupId: filterWorkerGroup})
const keywords = ["Hormuz", "Iran", "United States", "USA", "Donald", "Trump"]

// Max message age = 1 hour
const validInterval = 60 * 60 * 1000

// TODO: move to a constants file
const rawTweetsTopic = "tweets_raw"

async function cookRawTweets() {
  await consumer.connect()
  await consumer.subscribe({ topic: rawTweetsTopic, fromBeginning: true })
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const flag = filterRawTweet(message.value)
      if (flag == true) {
        produceFilteredMessage(message)
      }
    },
  })
}

// TODO: Reduce function complexity
async function filterRawTweet(tweet) {
  const pubDate = tweet.pubDate;
  const text    = stripHtml(tweet.description || tweet.title || '')

  if (!isRecent(pubDate, validInterval) || !matchesFilter(text, KEYWORDS)) {
    return false
  }

  return true
}

// TODO: Filter using AI Agent
function matchesFilter(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

function isRecent(pubDate, CHECK_INTERVAL_MS) {
  const tweetTime = new Date(pubDate).getTime();
  const cutoff    = Date.now() - TEST_TIME;
  return tweetTime >= cutoff;
}

module.exports = { cookRawTweets }