require('./opendsu-sdk/builds/output/openDSU.js');

const configs = require('./config.json');

const cleanStorageVolume = configs.CLEAN_STORAGE_VOLUME_ON_RESTART;
const createDefaultUser = configs.CREATE_DEMO_USER;

const Loader = require('./assistOS-sdk/Loader.js');
const userModule = Loader.loadModule('user');
const userAPIs = userModule.loadAPIs();



(async () => {
    let setupPromises = [];

    if (cleanStorageVolume) {
        const volume = require('./data-volume');
    }
    if (createDefaultUser) {
        setupPromises.push(userAPIs.createDemoUser());
    }

    await Promise.all(setupPromises);
})()


