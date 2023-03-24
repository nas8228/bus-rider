const kafkatizerService = require('../src/kafkatizerService.js');
const fs = require('fs');

describe('getUserConfig', () => {
    const configDir = './tests/assets/';
    const configStatic = 'config.json';
    const configDynamic = 'config2.json';

    afterAll(() => {
        fs.rmSync(configDir + configDynamic);
    });
    test('should return an object when file exist', () => {
        const jsonData = {
            kafkaSettings: {
                groupId: 'testGroup',
                brokerUrl: 'testBroker',
                userName: 'testUser',
                password: 'testPassword',
                timeout: '1000',
                darkMode: '0',
            },
        };
        expect(
            kafkatizerService.getUserConfig(configStatic, configDir)
        ).toStrictEqual(jsonData);
    });

    test('should return an object when file does not exist', () => {
        const jsonData = {
            kafkaSettings: {
                groupId: '',
                brokerUrl: '',
                userName: '',
                password: '',
                timeout: '1000',
                darkMode: '0',
            },
        };
        expect(
            kafkatizerService.getUserConfig(configDynamic, configDir)
        ).toStrictEqual(jsonData);
    });
});

describe('filterList', () => {
    test('should return an array with matching items', () => {
        const sortedList = [
            'auto.load.refresh',
            'pay.payment.added',
            'onboarding.factoringcompanydetails',
            'bulkload.batch.ready',
            'pay.webclient.loggedin',
        ];
        const query = 'load';
        const filteredList = ['auto.load.refresh', 'bulkload.batch.ready'];
        expect(kafkatizerService.filterList(sortedList, query)).toEqual(
            filteredList
        );
    });
});

describe('processMessage', () => {
    test('should recieve object with byte array properties and return properly formatted html', () => {
        //arrange
        const messageKey = { key: 'test', value: 'string' };
        const messageValue = { key: 'test_2', value: 'string_2' };
        const testKey = `{"${messageKey.key}" : "${messageKey.value}"}`;
        const testValue = `{"${messageValue.key}" : "${messageValue.value}"}`;
        const kafkaMessage = {
            key: JSON.parse(testKey),
            value: JSON.parse(testValue),
            timestamp: new Date('08/30/2022, 23:01:00').valueOf() 
        };
        const testDate = '8/30/2022, 23:01:00';
        kafkaMessage.key = getByteArray(kafkaMessage.key);
        kafkaMessage.value = getByteArray(kafkaMessage.value);
        const consumedList = [];        
        const returnKey =
            '{\n' +
            `  <span class="key">"${messageKey.key}":</span> <span class="string">"${messageKey.value}"</span>\n` +
            '}';
        const returnValue =
            '{\n' +
            `  <span class="key">"${messageValue.key}":</span> <span class="string">"${messageValue.value}"</span>\n` +            
            '}';
            const formatedList = [testDate, returnKey, returnValue];

        //act & assert
        expect(
            kafkatizerService.processMessage(kafkaMessage, consumedList)
        ).toEqual(formatedList);
    });
});

function getByteArray(value) {
    return Array.from(Buffer.from(JSON.stringify(value)));
}
