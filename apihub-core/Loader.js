const path = require('path');

const config = require('../config.json')

const STORAGE_VOLUME_PATH = path.join(__dirname, '../', config.STORAGE_VOLUME_PATH);

const volumeConfig = require(STORAGE_VOLUME_PATH).volumeConfigs;

function resolveVolumePath(volumeResourcePath) {
    return path.join(__dirname, "../", STORAGE_VOLUME_PATH, volumeResourcePath);
}

const modulePaths = {
    util: path.join(__dirname, './util'),
    document: path.join(__dirname, './documents'),
    space: path.join(__dirname, './space'),
    user: path.join(__dirname, './users'),
    services: path.join(__dirname, './services'),
    jwt: path.join(__dirname, "../", "apihub-components/apihub-component-utils/jwt.js"),
    cookie: path.join(__dirname, "../", "apihub-components/apihub-component-utils/cookie.js"),
    requestUtil: path.join(__dirname, "../", "apihub-components/apihub-component-utils/utils.js")
}

const storageVolumePaths = {
    space: resolveVolumePath(volumeConfig.SPACE_FOLDER_PATH),
    spaceMap: resolveVolumePath(volumeConfig.SPACE_MAP_PATH),
    user: resolveVolumePath(volumeConfig.USER_FOLDER_PATH),
    userMap: resolveVolumePath(volumeConfig.USER_MAP_PATH),
    userPendingActivation: resolveVolumePath(volumeConfig.USER_PENDING_ACTIVATION_PATH),
    userCredentials: resolveVolumePath(volumeConfig.USER_CREDENTIALS_PATH),
    defaultPersonalities: resolveVolumePath(volumeConfig.DEFAULT_PERSONALITIES_PATH),
    defaultFlows: resolveVolumePath(volumeConfig.DEFAULT_FLOWS_PATH),
}
const loader = {
    loadModule(moduleName, moduleSet) {
        const modulePath = modulePaths[moduleName];
        if (!modulePath) {
            throw new Error('Module not found');
        }
        const requiredModule = require(modulePath);

        if (Array.isArray(moduleSet)) {
            return moduleSet.reduce((acc, key) => {
                if (!requiredModule[key]) {
                    throw new Error(`Sub-module ${key} not found in ${moduleName}`);
                }
                acc[key] = requiredModule[key];
                return acc;
            }, {});
        }

        if (moduleSet && !requiredModule[moduleSet]) {
            throw new Error(`Sub-module ${moduleSet} not found in ${moduleName}`);
        }

        return moduleSet ? requiredModule[moduleSet] : requiredModule;
    },
    getStorageVolumePaths(resource) {
        if (resource) {
            if (!storageVolumePaths[resource]) {
                throw new Error(`Resource ${resource} not found in storage volume paths`);
            }
            return storageVolumePaths[resource];
        }
        return storageVolumePaths
    }
};

module.exports = loader
