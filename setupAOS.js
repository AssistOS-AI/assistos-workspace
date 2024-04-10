require('./opendsu-sdk/builds/output/openDSU.js');

const configs = require('./config.json');

const cleanStorageVolume = configs.CLEAN_STORAGE_VOLUME_ON_RESTART;
const createDefaultUser = configs.CREATE_DEMO_USER;

const createDemoUser = require('./apihub-core/exporter.js')
('createDemoUser');

(async () => {
    let setupPromises = [];

    if (cleanStorageVolume) {
        const volume = require('./data-volume/volume.js');
        await volume.clean()
    }
    if (createDefaultUser) {
        setupPromises.push(createDemoUser());
    }

    await Promise.all(setupPromises);
})()


