const path = require('path');
const fsPromises = require('fs').promises;
const {SPACE_FOLDER_PATH} = require('../../config.json');

const sortFiles = require('../exporter.js')
('sortFiles');

async function getSpaceDocumentsObject(spaceId) {

    const spacePath = path.join(__dirname, '../../../', SPACE_FOLDER_PATH, spaceId);
    const documentsDirectoryPath = path.join(spacePath, 'documents');

    const documentsFiles = await fsPromises.readdir(documentsDirectoryPath, {withFileTypes: true});

    const sortedDocumentsFiles = await sortFiles(documentsFiles,documentsDirectoryPath, 'creationDate');

    let spaceDocumentsObject = [];

    for (const fileName of sortedDocumentsFiles) {
        const documentJson = await fsPromises.readFile(path.join(documentsDirectoryPath, fileName), 'utf8');
        spaceDocumentsObject.push(JSON.parse(documentJson));
    }

    return spaceDocumentsObject;

}

module.exports = getSpaceDocumentsObject;
