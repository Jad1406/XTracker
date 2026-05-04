const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'xtracker-test',
  brokers: ['localhost:9092'],
});

function getKafkaClient() {
    return kafka
}

module.exports = {
    getKafkaClient
}