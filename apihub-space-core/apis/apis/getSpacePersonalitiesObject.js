const path = require('path');
const fsPromises = require('fs').promises;
const {SPACE_FOLDER_PATH} = require('../../config.json');

const sortFiles = require('../exporter.js')
('sortFiles');

async function getSpacePersonalitiesObject(spaceId) {

    const spacePath = path.join(__dirname, '../../../', SPACE_FOLDER_PATH, spaceId);
    const personalitiesDirectoryPath = path.join(spacePath, 'personalities');

    const personalitiesFiles = await fsPromises.readdir(personalitiesDirectoryPath, {withFileTypes: true});

    const sortedPersonalitiesFiles = await sortFiles(personalitiesFiles,personalitiesDirectoryPath, 'creationDate');

    let spacePersonalitiesObject = [];

    for (const fileName of sortedPersonalitiesFiles) {
        const personalityJson = await fsPromises.readFile(path.join(personalitiesDirectoryPath, fileName), 'utf8');
        spacePersonalitiesObject.push(JSON.parse(personalityJson));
    }

    return spacePersonalitiesObject;

}

module.exports = getSpacePersonalitiesObject;
