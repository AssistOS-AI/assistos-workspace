const configs = require('./config.json');
const cleanStorageVolume = configs.CLEAN_STORAGE_VOLUME_ON_RESTART;
(async () => {
    let setupPromises = [];

    if (cleanStorageVolume) {
        const volume = require('./data-volume');
    }

    await Promise.all(setupPromises);
})()


