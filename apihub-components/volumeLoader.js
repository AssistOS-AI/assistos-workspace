
const STORAGE_VOLUME_PATH = path.join(__dirname, '../', config.STORAGE_VOLUME_PATH);
const volumeConfig = require(STORAGE_VOLUME_PATH).volumeConfigs;

function resolveVolumePath(volumeResourcePath) {
    return path.join(STORAGE_VOLUME_PATH, volumeResourcePath);
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
};