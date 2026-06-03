const { ConfigSource } = require('kafkajs')
const { getKafkaClient } = require('../clients/kafka');
const { produceFilteredTweet } = require('../producers/processFilteredTweets');
const { stripHtml } = require('../producers/nitter.js')

const filterWorkerGroup = "filter_worker_10"
const consumer = getKafkaClient().consumer({ groupId: filterWorkerGroup})

const keywords = ["Hormuz", "Iran", "United States", "USA", "Donald", "Trump", "If that were to be pursued, obviously that would be very controversial, have enormous political risks"]

// Max message age = 1 hour
const validInterval = 60 * 60 * 1000

// TODO: move to a constants file
const rawTweetsTopic = "tweets_raw"

async function cookRawTweets() {
  console.log("Starting consumer...")
  await consumer.connect()
  await consumer.subscribe({ topic: rawTweetsTopic, fromBeginning: true })
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      if (filterRawTweet(JSON.parse(message.value.toString()))) {
        const produced = await produceFilteredTweet(message)
        if (produced == false) {
          console.log("Failed to produce message")
        }
      } else {
        console.log("Message did not pass the filter")
      }
    },
  })
}

// TODO: FIlter with AI
function filterRawTweet(tweet) {
  const dateOfPost = tweet.dateOfPost;
  const text    = stripHtml(tweet.description || tweet.title || '')

  if (!isRecent(dateOfPost, validInterval) || !matchesFilter(text, keywords)) {
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
  const cutoff    = Date.now() - CHECK_INTERVAL_MS;
  return tweetTime >= cutoff;
}

module.exports = { cookRawTweets }