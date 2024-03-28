const fsPromises = require('fs').promises;
const path = require('path');

const createDirectory = require('../exporter.js')('createDirectory');

async function copySpaceStatus(spacePath, spaceObject) {
    await createDirectory(path.join(spacePath, 'status'));
    const statusPath = path.join(spacePath, 'status', 'status.json');
    await fsPromises.writeFile(statusPath, JSON.stringify(spaceObject, null, 2));
}

module.exports = copySpaceStatus