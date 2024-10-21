const path = require('path');

const config = require('../data-volume/config/config.json');
const STORAGE_VOLUME_PATH = path.join(__dirname, '../', config.STORAGE_VOLUME_PATH);
const volume=require('../data-volume');

function resolveVolumePath(volumeResourcePath) {
    return path.join(STORAGE_VOLUME_PATH, volumeResourcePath);
}

module.exports = {
    getBaseURL:()=>{
        return config.ENVIRONMENT_MODE==='development'?config.DEVELOPMENT_BASE_URL:config.PRODUCTION_BASE_URL;
    },
    config: config,
    paths: {
        assets: resolveVolumePath(volume.configs.ASSETS_FOLDER_PATH),
        space: resolveVolumePath(volume.configs.SPACE_FOLDER_PATH),
        spaceMap: resolveVolumePath(volume.configs.SPACE_MAP_PATH),
        spacePendingInvitations: resolveVolumePath(volume.configs.SPACE_PENDING_INVITATIONS_PATH),
        user: resolveVolumePath(volume.configs.USER_FOLDER_PATH),
        userMap: resolveVolumePath(volume.configs.USER_MAP_PATH),
        userPendingActivation: resolveVolumePath(volume.configs.USER_PENDING_ACTIVATION_PATH),
        userCredentials: resolveVolumePath(volume.configs.USER_CREDENTIALS_PATH),
        defaultPersonalities: resolveVolumePath(volume.configs.DEFAULT_PERSONALITIES_PATH),
        defaultFlows: resolveVolumePath(volume.configs.DEFAULT_FLOWS_PATH),
    },
    clean: volume.clean
};
