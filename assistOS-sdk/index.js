const moduleCache = {};
const path = require('path');

const modulePaths = {
    util: './util',
    document: './document',
    space: './space',
    user: './user',
    services: './services',
    constants: './constants.js',
};

module.exports = {
    loadModule: function(moduleName) {
        const modulePath = path.join(__dirname, modulePaths[moduleName]);
        if (!modulePath) {
            throw new Error(`Module '${moduleName}' not found`);
        }
        if (!moduleCache[moduleName]) {
            moduleCache[moduleName] = require(modulePath);
        }
        return moduleCache[moduleName];
    },
};
