async function copySpaceStatus(spacePath, spaceObject) {
    const fsPromises = require('fs').promises;
    const path = require('path');

    const createDirectory = require('../exporter.js')('createDirectory');
    await createDirectory(path.join(spacePath, 'status'));

    const statusPath = path.join(spacePath, 'status', 'status.json');
    await fsPromises.writeFile(statusPath, JSON.stringify(spaceObject));
}

module.exports = copySpaceStatus