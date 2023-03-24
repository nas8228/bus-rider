const kafkaService = require('./kafkaService.js');
const kafkatizerService = require('./kafkatizerService.js');
const app = require('electron');
const configDir = app.remote.app.getPath('userData');
let config = kafkatizerService.getUserConfig('config.json', configDir);
const groupId = document.getElementById('groupId');
const brokerUrl = document.getElementById('brokerUrl');
const username = document.getElementById('uName');
const password = document.getElementById('pWord');
const timeout = document.getElementById('timeout');
const container = document.getElementById('container');
const darkMode = document.getElementById('darkMode');
const messages = document.getElementById('messages');
const keyInput = document.getElementById('keyInput');
const valueInput = document.getElementById('valueInput');
let topics = [];
let kafka;
document.getElementById('version').innerHTML = app.remote.app.getVersion();
showModal();

darkMode.onchange = () => {
    changeColor();
};

window.filterTopics = function (inputId, listId) {
    const value = document.getElementById(inputId).value;
    if (value.length > 2) {
        // filter on at least 3 characters
        const dataList = document.getElementById(listId);
        let sortedList = topics.sort();
        clearDatalist(dataList);
        var filteredList = kafkatizerService.filterList(sortedList, value);

        filteredList.forEach((item) => {
            var option = document.createElement('option');
            option.value = item;
            dataList.append(option);
        });
    }
};

window.showModal = function () {
    showModal();
};

window.connect = function () {
    saveModal();
    setUpKafka();
};

window.closeModal = function () {
    saveModal();
};

window.requireFields = function () {
    const fields = ['groupId', 'brokerUrl', 'uName', 'pWord'];
    const disabled = checkFieldValues(fields);
    return !disabled;
};

window.clearElement = function (element) {
    if (element === 'produce') {
        keyInput.value = '';
        valueInput.value = '';
    } else if (element === 'consume') {
        messages.innerHTML = '';
    }
}

async function produceKafka() {
    let topic = document.getElementById('topicProduce').value;
    let key = keyInput.value;
    let value = valueInput.value;
    try {
        await kafkaService.produceKafkaMessage(kafka, topic, key, value);
    } catch (ex) {
        console.log(ex.toString);
    }
}

async function consumeKafka() {
    const topic = document.getElementById('topicConsume').value;
    const button = document.getElementById('btnConsume');

    try {
        isLoading(true);
        if (button.outerText == 'Consume') {
            if (topic != '') {
                const consumer = await kafkaService.consumeKafkaMessage(
                    kafka,
                    config,
                    topic
                );
                await consumer.run({
                    eachMessage: async ({ message }) => {
                        try {
                            const [dateText, keyText, messageText] = kafkatizerService.processMessage(message);
                            const messageDiv = document.createElement('div');
                            const dateDiv = document.createElement('div');
                            dateDiv.className = 'messageContent';
                            dateDiv.innerHTML = dateText;
                            messageDiv.append(dateDiv);
                            if (keyText.length > 0) {
                                const keyDiv = document.createElement('div');                                
                                const keyPre = document.createElement('pre');
                                keyDiv.className = 'messageContent';
                                keyDiv.innerHTML = 'Key:';
                                messageDiv.append(keyDiv);
                                keyPre.className = 'messageContent form-control';
                                if (darkMode.checked) keyPre.classList.add('darkMode-input');
                                keyPre.innerHTML = keyText;
                                messageDiv.append(keyPre);
                            }
                            const valueDiv = document.createElement('div'); 
                            const messagePre = document.createElement('pre');
                            valueDiv.className = 'messageContent';
                            valueDiv.innerHTML = 'Value:';
                            messageDiv.append(valueDiv);
                            messagePre.className = 'messageContent form-control';
                            if (darkMode.checked) messagePre.classList.add('darkMode-input');
                            messagePre.innerHTML = messageText;
                            messageDiv.append(messagePre);
                            messages.prepend(messageDiv);
                        } catch (e) {
                            console.log(e.toString());
                            alert(e.toString());
                        }
                    },
                });
                process.on('stopConsumer', async () => {
                    consumer.disconnect().catch((e) => {
                        console.log(e.toString());
                        alert(e.toString());
                    });
                });

                button.textContent = 'Stop Consuming';
                button.classList.add('btn-danger');
                button.classList.remove('btn-success');
                isLoading(false);
            } else {
                alert('Please enter a valid topic.');
                isLoading(false);
            }
        } else {
            isLoading(false);
            process.emit('stopConsumer');
            button.textContent = 'Consume';
            button.classList.remove('btn-danger');
            button.classList.add('btn-success');
        }
    } catch (ex) {
        isLoading(false);
        alert(ex.message);
        console.log(ex);
    }
}

function showModal() {
    window.$('#modal').modal({
        show: true,
        backdrop: 'static',
        keyboard: false,
    });
    groupId.value = config.kafkaSettings.groupId;
    brokerUrl.value = config.kafkaSettings.brokerUrl;
    username.value = config.kafkaSettings.userName;
    password.value = config.kafkaSettings.password;
    timeout.value = config.kafkaSettings.timeout
        ? config.kafkaSettings.timeout
        : '1000';
    if (config.kafkaSettings.darkMode) {
        switch (config.kafkaSettings.darkMode) {
            case '0':
                darkMode.checked = false;
                break;
            case '1':
                darkMode.checked = true;
                break;
            default:
                darkMode.checked = false;
        }
        changeColor();
    } else {
        darkMode.checked = false;
    }
}

function saveModal() {
    config.kafkaSettings.groupId = groupId.value;
    config.kafkaSettings.brokerUrl = brokerUrl.value;
    config.kafkaSettings.userName = username.value;
    config.kafkaSettings.password = password.value;
    config.kafkaSettings.timeout = timeout.value;
    config.kafkaSettings.darkMode = darkMode.checked ? '1' : '0';
    kafkatizerService.saveFile(config, 'config.json', configDir);
}

async function setUpKafka() {
    const certDir = kafkatizerService.getUserCert(configDir);
    kafka = kafkaService.setUpKafka(config, certDir);
    try {
        isLoading(true);
        topics = await kafkaService.getTopicList(kafka);
        topics.sort();
        showConnection(true);
        isLoading(false);
    } catch (e) {
        let message = '';
        if (e.message == 'Connection timeout') {
            message =
                '\n 1. Are you connected to the VPN? \n\r 2. Is the bootstrap server entered correctly? \n\r 3. Do you need to increase the Connection Timeout?';
        }

        if (e.message.includes('Failed to connect')) {
            message = '\n Check the port number entered (ex. ":9092")';
        }

        isLoading(false);
        showConnection(false);
        console.log(e.toString());
        alert(e.message + '!\n' + message);
        showModal();
    }
}

function clearDatalist(el) {
    var childArray = el.children;
    var cL = childArray.length;
    while (cL > 0) {
        cL--;
        el.removeChild(childArray[cL]);
    }
}

function changeColor() {
    const formInputs = document.getElementsByClassName('form-control');
    const body = document.getElementsByTagName('body');
    const text = document.getElementById('darkMode-text');
    const modal = document.getElementById('modalContent');
    if (darkMode.checked) {
        body[0].classList.add('darkMode');
        modal.classList.add('darkMode');
        text.classList.add('lightMode-text');
        text.classList.remove('darkMode-text');
        text.innerHTML = 'Light Mode';
        for (const i of formInputs) {
            i.classList.add('darkMode-input');
        }
    } else {
        body[0].classList.remove('darkMode');
        modal.classList.remove('darkMode');
        text.classList.remove('lightMode-text');
        text.classList.add('darkMode-text');
        text.innerHTML = 'Dark Mode';
        for (const i of formInputs) {
            i.classList.remove('darkMode-input');
        }
    }
}

function isLoading(isLoading) {
    const spinner = document.getElementById('spinner');
    if (isLoading) {
        container.classList.add('loading');
        spinner.classList.remove('hidden');
    } else {
        container.classList.remove('loading');
        spinner.classList.add('hidden');
    }
}

function showConnection(connected) {
    const connection = document.getElementById('connection');
    if (connected) {
        connection.innerHTML = 'CONNECTED!';
        connection.style = 'color:lightgreen';
        container.classList.remove('disabled');
    } else {
        connection.innerHTML = 'DISCONNECTED';
        connection.style = 'color:orangered';
        container.classList.add('disabled');
    }
}

function checkFieldValues(fields) {
    return fields.every(checkIfValue);
}

function checkIfValue(field) {
    const value = document.getElementById(field).value;
    if (value == '') {
        return false;
    } else {
        return true;
    }
}

document.querySelector('#btnPublish').addEventListener('click', () => {
    produceKafka();
});

document.querySelector('#btnConsume').addEventListener('click', () => {
    consumeKafka();
});
