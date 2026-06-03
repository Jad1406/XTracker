  const consumer = Kafka.consumer()
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


main().catch(error => {
  console.error(error);
  process.exit(1);
});