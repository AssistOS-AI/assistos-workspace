const path = require('path');
const fsPromises = require('fs').promises;
const {SPACE_FOLDER_PATH} = require('../../config.json');

const sortFiles = require('../exporter.js')
('sortFiles');
const enclave = require("opendsu").loadAPI("enclave");

async function getSpaceDocumentsObject(spaceId) {

    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    try {
        let records = await $$.promisify(lightDBEnclaveClient.getAllRecords)($$.SYSTEM_IDENTIFIER, 'documents');
        let documentIds = records.map(record => record.data);
        for(let documentId of documentIds){
            let document = await $$.promisify(lightDBEnclaveClient.getAllRecords)($$.SYSTEM_IDENTIFIER, documentId);
            console.log(document);
        }
    }catch (e){
        console.log(e + "no documents yet");
    }

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
