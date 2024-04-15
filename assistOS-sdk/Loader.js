const path = require('path');
const config = require('../config.json');

const STORAGE_VOLUME_PATH = path.join(__dirname, '../', config.STORAGE_VOLUME_PATH);
const volumeConfig = require(STORAGE_VOLUME_PATH).volumeConfigs;

function resolveVolumePath(volumeResourcePath) {
    return path.join(STORAGE_VOLUME_PATH, volumeResourcePath);
}

const modulePaths = {
    util: './util',
    document: './document',
    space: './space',
    user: './user',
    services: './services',
    jwt: "./apihub-components/apihub-component-utils/jwt.js",
    cookie: "./apihub-components/apihub-component-utils/cookie.js",
    requestUtil: "./apihub-components/apihub-component-utils/utils.js",
    config: '../config.json',
    constants: './constants.js',
};

const storageVolumePaths = {
    space: resolveVolumePath(volumeConfig.SPACE_FOLDER_PATH),
    spaceMap: resolveVolumePath(volumeConfig.SPACE_MAP_PATH),
    user: resolveVolumePath(volumeConfig.USER_FOLDER_PATH),
    userMap: resolveVolumePath(volumeConfig.USER_MAP_PATH),
    userPendingActivation: resolveVolumePath(volumeConfig.USER_PENDING_ACTIVATION_PATH),
    userCredentials: resolveVolumePath(volumeConfig.USER_CREDENTIALS_PATH),
    defaultPersonalities: resolveVolumePath(volumeConfig.DEFAULT_PERSONALITIES_PATH),
    defaultFlows: resolveVolumePath(volumeConfig.DEFAULT_FLOWS_PATH),
};

const moduleCache = {};

const loader = {
    loadModule: function(moduleName) {
        const modulePath = path.join(__dirname, modulePaths[moduleName]);
        if (!modulePath) {
            throw new Error(`Module path '${moduleName}' not found`);
        }
        if (!moduleCache[moduleName]) {
            moduleCache[moduleName] = require(modulePath);
        }
        return moduleCache[moduleName];
    },
    getStorageVolumePaths: function(resource) {
        const resourcePath = storageVolumePaths[resource];
        if (!resourcePath) {
            throw new Error(`Resource '${resource}' not found in storage volume paths`);
        }
        return resourcePath;
    }
};

module.exports = loader;
