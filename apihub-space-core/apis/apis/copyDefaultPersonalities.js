async function copyDefaultPersonalities(spacePath) {
    const fsPromises = require('fs').promises;
    const path = require('path');

    const {DEFAULT_PERSONALITIES_PATH} = require('../../config.json');
    const createDirectory = require('../exporter.js')('createDirectory');

    const personalitiesPath = path.join(spacePath, 'personalities');

    await createDirectory(personalitiesPath);

    const filesPath = path.join(__dirname,'../../../',DEFAULT_PERSONALITIES_PATH);
    const files = await fsPromises.readdir(filesPath);
    for (const file of files) {
        const filePath = path.join(filesPath, file);
        const destFilePath = path.join(personalitiesPath, file);
        await fsPromises.copyFile(filePath, destFilePath);
    }

}

module.exports = copyDefaultPersonalities