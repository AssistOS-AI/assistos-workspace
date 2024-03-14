async function copyDefaultFlows(spacePath) {
    const fsPromises = require('fs').promises;
    const path = require('path');

    const {DEFAULT_FLOWS_PATH} = require('../../config.json');
    const createDirectory = require('../exporter.js')('createDirectory');

    const flowsPath = path.join(spacePath, 'flows');

    await createDirectory(flowsPath);

    const filesPath = path.join(__dirname,'../../../',DEFAULT_FLOWS_PATH);
    const files = await fsPromises.readdir(filesPath);
    for (const file of files) {
        const filePath = path.join(filesPath, file);
        const destFilePath = path.join(flowsPath, file);
        await fsPromises.copyFile(filePath, destFilePath);
    }
}
module.exports = copyDefaultFlows

