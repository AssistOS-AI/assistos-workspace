const path = require('path');
const fsPromises = require('fs').promises;

const {
    SPACE_MAP_PATH,
} = require('../../config.json');

async function getSpacesMap() {
    const spacesMapPath = path.join(__dirname, '../../../', SPACE_MAP_PATH);
    let spacesMapObject = JSON.parse(await fsPromises.readFile(spacesMapPath, 'utf8'));
    return spacesMapObject;
}

module.exports = getSpacesMap;