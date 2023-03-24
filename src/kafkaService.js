const { Kafka } = require('kafkajs');
const fs = require('fs');

function setUpKafka(config, cert) {
    return new Kafka({
        brokers: [config.kafkaSettings.brokerUrl],
        ssl: {
            ca: [fs.readFileSync(cert, 'utf-8')],
        },
        sasl: {
            mechanism: 'plain', // scram-sha-256 or scram-sha-512
            username: config.kafkaSettings.userName,
            password: config.kafkaSettings.password,
        },
        retry: {
            retries: 3
        },
        connectionTimeout: parseInt(config.kafkaSettings.timeout)

    });
}

async function getTopicList(kafka) {
    const admin = kafka.admin();
    await admin.connect();
    return await admin.listTopics();
}

async function produceKafkaMessage(kafka, topic, key, value) {
    const producer = kafka.producer();
    await producer.connect();
    const message = { value: value };
    if (key.trim().length !== 0)
    {
        message.key = key;
    }
    await producer.send({
        topic: topic,
        messages: [message],
    });
    await producer.disconnect();
}

async function consumeKafkaMessage(kafka, config, topic) {
    const consumer = kafka.consumer({ groupId: config.kafkaSettings.groupId });
    await consumer.connect();
    await consumer.subscribe({ topic: topic });
    return consumer;
}

module.exports = {
    setUpKafka: setUpKafka,
    getTopicList: getTopicList,
    produceKafkaMessage: produceKafkaMessage,
    consumeKafkaMessage: consumeKafkaMessage
}