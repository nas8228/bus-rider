const fs = require('fs');
const path = require('path');

function getUserConfig(fileName, configDir) {
    try {
        return JSON.parse(fs.readFileSync(path.join(configDir, fileName)));
    } catch (e) {
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
        saveFile(jsonData, fileName, configDir);
        return JSON.parse(fs.readFileSync(path.join(configDir, fileName)));
    }
}

function getUserCert(configDir) {
    const fileName = 'cacert.pem';
    const certDir = path.join(configDir, fileName);
    try {
        fs.readFileSync(certDir);
        return certDir;
    } catch (e) {
        try {
            const localCertDir = findPath(fileName);
            saveCert(localCertDir, configDir, fileName);
            return certDir;
        } catch (ex) {
            console.log(ex.toString);
            alert(ex.toString());
        }
    }
}

function findPath(fileName) {
    let localCertDir = './cert/';
    try {
        fs.readFileSync(path.join(localCertDir, fileName));
        return localCertDir;
    } catch (ex) {
        return './resources/app/cert';
    }
}

function saveFile(jsonData, fileName, configDir) {
    fs.writeFileSync(path.join(configDir, fileName), JSON.stringify(jsonData));
}

function saveCert(certDir, configDir, fileName) {
    const src = path.join(certDir, fileName);
    const dst = path.join(configDir, fileName);
    fs.copyFileSync(src, dst);
}

function filterList(sortedList, query) {
    const regExp = new RegExp('(?:' + query + ')');
    let filteredList = [];

    sortedList.forEach((item) => {
        if (regExp.test(item)) {
            if (!filteredList.includes(item)) {
                filteredList.push(item);
            }
        }
    });
    return filteredList;
}

function processMessage(message) {
    const date = (new Date(parseInt(message.timestamp)));
    const formattedDate = date.toLocaleString('en-US', { hour12: false });
    let key = "";
    if (message.key != null && message.key[0]) {
        key = syntaxHighlight(String.fromCharCode.apply(null, message.key));
    }
    const value = syntaxHighlight(String.fromCharCode.apply(null, message.value));
    return [formattedDate, key, value];
}

function pad(number, width, pad)
{
    return String(number).padStart(width, pad);
}

function syntaxHighlight(json) {
    json = JSON.stringify(JSON.parse(json), null, 2);
    json = json
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    return json.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        function (match) {
            var cls = 'number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'key';
                } else {
                    cls = 'string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'boolean';
            } else if (/null/.test(match)) {
                cls = 'null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        }
    );
}

module.exports = {
    getUserConfig: getUserConfig,
    getUserCert: getUserCert,
    saveFile: saveFile,
    filterList: filterList,
    processMessage: processMessage,
};
