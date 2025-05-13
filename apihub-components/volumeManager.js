const path = require('path');

const config = require('../data-volume/config/config.json');
const STORAGE_VOLUME_PATH = path.join(__dirname, '../', config.STORAGE_VOLUME_PATH);

function resolveVolumePath(volumeResourcePath) {
    return path.join(STORAGE_VOLUME_PATH, volumeResourcePath);
}

module.exports = {
    getBaseURL:()=>{
        return config.ENVIRONMENT_MODE==='development'?config.DEVELOPMENT_BASE_URL:config.PRODUCTION_BASE_URL;
    },
    config: config,
    paths: {
    }
};
