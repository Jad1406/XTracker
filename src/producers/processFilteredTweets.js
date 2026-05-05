const { getKafkaClient } = require('../clients/kafka')
const producer = getKafkaClient().producer()

// TODO: Move to constant folder
const filteredTweersTopic = 'tweets_filtered'

// TODO: Implement the producer to tweets_filtered
async function produceFilteredTweet(tweet) {
    await producer.connect();
    try {
        producer.send({
            topic: filteredTweersTopic,
            messages: [
                { value: JSON.stringify(tweet) },
            ],
        });
        console.log('Message sent successfully')
        return true
    } catch (err) {
        console.log('Error sending message:', err)
        return false
    }
}

module.exports = { produceFilteredTweet }