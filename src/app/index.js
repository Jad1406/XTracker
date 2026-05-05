const { fetchTweets } = require('../clients/nitter.js');
const { produceMessage } = require('../producers/nitter.js')
const { cookRawTweets } = require('../consumers/processRawTweets.js')

const config = {
  TARGET_ACCOUNT: 'Reuters',
  KEYWORDS: [''],
  CHECK_INTERVAL_MS: 0.1 * 60 * 1000,
  WHATSAPP_GROUP_ID: '',
};

async function mainProducer() {
  const rawTweets = await fetchTweets(config);
  const produced = await produceMessage(rawTweets)
  if (produced == false) {
    console.log("Failed to produce message")
  } else {
    console.log("Production was successfull")
  }
}

async function mainConsumer() {
  await cookRawTweets();
}

mainConsumer().catch(err => {
  console.error(err);
  process.exit(1);
});
