import { getKafkaClient } from '../clients/kafka'

const consumer = getKafkaClient().consumer({ groupId: 'filtered_tweets_consumer' })
const filteredTweetsTopic = 'tweets_filtered'

async function consumeFilteredTweets(waClient, whatsappGroups) {
    await consumer.connect();
    await consumer.subscribe({ topic: filteredTweetsTopic, fromBeginning: true })
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try{ 
                whatsappGroups.foreach(async groupId => {
                    await waClient.sendMessage(groupId, formatTweets(JSON.parse(message.value.toString())));
                })
            } catch (err) {
                console.error('Error sending message to WhatsApp:', err);
            }
        },
    });
}   

function formatTweets(tweet) {
    return tweet.body ? `${tweet.title}\n\n${tweet.body}` : tweet.title;
}

module.exports = { consumeFilteredTweets }
