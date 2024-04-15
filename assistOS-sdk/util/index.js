const apiModules = {
    get crypto() {
        const module = require('./apis/crypto.js');
        Object.defineProperty(this, 'crypto', { value: module, writable: false, configurable: true });
        return module;
    },
    get data() {
        const module = require('./apis/data.js');
        Object.defineProperty(this, 'data', { value: module, writable: false, configurable: true });
        return module;
    },
    get date() {
        const module = require('./apis/date.js');
        Object.defineProperty(this, 'date', { value: module, writable: false, configurable: true });
        return module;
    },
    get file() {
        const module = require('./apis/file.js');
        Object.defineProperty(this, 'file', { value: module, writable: false, configurable: true });
        return module;
    },
    get openAI() {
        const module = require('./apis/openAI.js');
        Object.defineProperty(this, 'openAI', { value: module, writable: false, configurable: true });
        return module;
    }
};

const data = {};

function loadAPIs(...apiNames) {
    if (apiNames.length === 0) {
        apiNames = Object.keys(apiModules);
    }
    if (apiNames.length === 1) {
        const api = apiModules[apiNames[0]];
        if (!api) {
            throw new Error(`API '${apiNames[0]}' not found`);
        }
        return api;
    }
    const selectedApis = {};
    for (const name of apiNames) {
        if (!apiModules[name]) {
            throw new Error(`API '${name}' not found`);
        }
        selectedApis[name] = apiModules[name];
    }
    return selectedApis;
}

module.exports = { loadAPIs };