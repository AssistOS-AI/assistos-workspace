const apiModules = {
    get email() {
        const module = require('./email');
        Object.defineProperty(apiModules, 'email', {
            value: module,
            writable: false,
            configurable: true
        });
        return module;
    }
}

function loadServices(...serviceNames) {
    if (serviceNames.length === 0) {
        serviceNames = Object.keys(apiModules);
    }
    if (serviceNames.length === 1) {
        const service = apiModules[serviceNames[0]];
        if (!service) {
            throw new Error(`API '${serviceNames[0]}' not found`);
        }
        return service;
    }
    const selectedApis = {};
    for (const name of serviceNames) {
        if (!apiModules[name]) {
            throw new Error(`API '${name}' not found`);
        }
        selectedApis[name] = apiModules[name];
    }
    return selectedApis;
}


module.exports = {
    loadServices,
}
