const apiModules = {
    get space() {
        const module = require('./apis');
        Object.defineProperty(apiModules, 'space', {value: module, writable: false, configurable: true});
        return module;
    }
};
const dataModules = {
    templates: {
        get defaultApiKeyTemplate() {
            const data = require('./data/templates/json/defaultApiKeyTemplate.json');
            Object.defineProperty(dataModules, 'defaultApiKeyTemplate', {
                value: data,
                writable: false,
                configurable: true
            });
            return data;
        },
        get defaultSpaceAnnouncement() {
            const data = require('./data/templates/json/defaultSpaceAnnouncement.json');
            Object.defineProperty(dataModules, 'defaultSpaceAnnouncement', {
                value: data,
                writable: false,
                configurable: true
            });
            return data;
        },
        get defaultSpaceTemplate() {
            const data = require('./data/templates/json/defaultSpaceTemplate.json');
            Object.defineProperty(dataModules, 'defaultSpaceTemplate', {
                value: data,
                writable: false,
                configurable: true
            });
            return data;
        },
        get defaultSpaceNameTemplate() {
            const data = require('./data/templates/json/defaultSpaceNameTemplate.json');
            Object.defineProperty(dataModules, 'defaultSpaceNameTemplate', {
                value: data,
                writable: false,
                configurable: true
            });
            return data;
        },
        get spaceValidationSchema() {
            const data = require('./data/templates/spaceValidationSchema.json');
            Object.defineProperty(dataModules, 'spaceValidationSchema', {
                value: data,
                writable: false,
                configurable: true
            });
            return data;
        }

    }
}

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

function loadData(...dataTypes) {
    if (dataTypes.length === 0) {
        dataTypes = Object.keys(dataModules);
    }
    if (dataTypes.length === 1) {
        const data = dataModules[dataTypes[0]];
        if (!data) {
            throw new Error(`Data '${dataTypes[0]}' not found`);
        }
        return data;
    }
    const selectedData = {};
    for (const type of dataTypes) {
        if (!dataModules[type]) {
            throw new Error(`Data '${type}' not found`);
        }
        selectedData[type] = dataModules[type];
    }
    return selectedData;
}

module.exports = {loadAPIs, loadData};

