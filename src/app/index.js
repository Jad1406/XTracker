const { fetchTweets } = require('../clients/nitterClient.js');
const { produceMessage } = require('../producers/nitter.js')

const config = {
  TARGET_ACCOUNT: 'Reuters',
  KEYWORDS: [''],
  CHECK_INTERVAL_MS: 0.1 * 60 * 1000,
  WHATSAPP_GROUP_ID: '',
};

async function main() {
  const rawTweets = await fetchTweets(config);
  const produced = await produceMessage(rawTweets)
  if (produced == false) {
    console.log("Failed to produce message")
  } else {
    console.log("Production was successfull")
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
