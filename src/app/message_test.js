const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'xtracker-test',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'test-group' });

async function main() {
  await producer.connect();

  await producer.send({
    topic: 'tweets_raw',
    messages: [
      {
        key: 'test-1',
        value: JSON.stringify({
          tweetId: 'test-1',
          text: 'Hello KafkaJS user!',
          createdAt: new Date().toISOString(),
        }),
      },
    ],
  });

  console.log('Message sent');

  await producer.disconnect();

  await consumer.connect();

  await consumer.subscribe({
    topic: 'tweets_raw',
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        topic,
        partition,
        key: message.key?.toString(),
        value: message.value.toString(),
      });
    },
  });
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});