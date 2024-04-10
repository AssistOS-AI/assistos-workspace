const path= require('path');
const fsPromises= require('fs').promises;
const enclave = require("opendsu").loadAPI("enclave");

const storageVolumePaths = require('../Loader.js').getStorageVolumePaths();


async function addAnnouncement(spaceId, announcementObject) {
    const spaceStatusObject = getSpaceStatusObject(spaceId)
    spaceStatusObject.announcements.push(announcementObject)
    await updateSpaceStatus(spaceStatusObject);
}

async function addSpaceToSpaceMap(spaceId, spaceName) {
    let spacesMapObject = JSON.parse(await fsPromises.readFile('../'+storageVolumePaths.spaceMap, 'utf8'));

    if (spacesMapObject.hasOwnProperty(spaceId)) {
        throw new Error(`Space with id ${spaceId} already exists`);
    } else {
        spacesMapObject[spaceId] = spaceName;
    }
    await fsPromises.writeFile(storageVolumePaths.spaceMap, JSON.stringify(spacesMapObject, null, 2), 'utf8', {encoding: 'utf8'});

}

async function copyDefaultFlows(spacePath) {

    const {DEFAULT_FLOWS_PATH} = require('../../../config.json');
    const createDirectory = require('../../exporter.js')('createDirectory');

    const flowsPath = path.join(spacePath, 'flows');

    await createDirectory(flowsPath);

    const filesPath = path.join(__dirname, '../../../', DEFAULT_FLOWS_PATH);
    const files = await fsPromises.readdir(filesPath);
    for (const file of files) {
        const filePath = path.join(filesPath, file);
        const destFilePath = path.join(flowsPath, file);
        await fsPromises.copyFile(filePath, destFilePath);
    }
}

async function copyDefaultPersonalities(spacePath) {
    const fsPromises = require('fs').promises;
    const path = require('path');

    const {DEFAULT_PERSONALITIES_PATH} = require('../../../config.json');
    const createDirectory = require('../../exporter.js')('createDirectory');

    const personalitiesPath = path.join(spacePath, 'personalities');

    await createDirectory(personalitiesPath);

    const filesPath = path.join(__dirname, '../../../', DEFAULT_PERSONALITIES_PATH);
    const files = await fsPromises.readdir(filesPath);
    for (const file of files) {
        const filePath = path.join(filesPath, file);
        const destFilePath = path.join(personalitiesPath, file);
        await fsPromises.copyFile(filePath, destFilePath);
    }
}

function createDefaultAnnouncement(spaceName) {
    const date = getCurrentUTCDate();
    const announcementId = generateId();
    return templateReplacer_$$(defaultSpaceAnnouncement,
        {
            announcementId: announcementId,
            spaceName: spaceName,
            currentUTCDate: date
        })
}


async function createSpace(spaceName, userId, apiKey) {
    const rollback = async (spacePath) => {
        try {
            await fsPromises.rm(spacePath, {recursive: true, force: true});
        } catch (error) {
            console.error(`Failed to clean up space directory at ${spacePath}: ${error}`);
            throw error;
        }
    };

    const spaceId = generateId();
    let spaceObj = {}
    try {
        spaceObj = templateReplacer_$$(defaultSpaceTemplate, {
            spaceName: spaceName,
            spaceId: spaceId,
            adminId: userId,
            apiKey: apiKey ? templateReplacer_$$(defaultApiKeyTemplate, {
                keyType: "OpenAI",
                ownerId: userId,
                keyId: generateId(),
                keyValue: maskOpenAIKey(apiKey)
            }) : undefined,
            spaceAgent: defaultSpaceAgent,
            defaultAnnouncement: createDefaultAnnouncement(spaceName),
            creationDate: getCurrentUTCDate()
        });
    } catch (error) {
        error.message = 'Error creating space';
        error.statusCode = 500;
        throw error;
    }
    let spaceValidationResult = {};
    try {
        spaceValidationResult = validateData(spaceValidationSchema, spaceObj);
    } catch (error) {
        error.message = 'Error validating space data';
        error.statusCode = 500;
        throw error;
    }
    if (spaceValidationResult.status === false) {
        const error = new Error(spaceValidationResult.errorMessage);
        error.statusCode = 400;
        throw error;
    }

    const spacePath = path.join(__dirname, '../../../', `${SPACE_FOLDER_PATH}`, `${spaceId}`);

    await createDirectory(spacePath);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    await $$.promisify(lightDBEnclaveClient.createDatabase)(spaceId);
    await $$.promisify(lightDBEnclaveClient.grantWriteAccess)($$.SYSTEM_IDENTIFIER);
    const filesPromises = [
        () => copyDefaultFlows(spacePath),
        () => copyDefaultPersonalities(spacePath),
        () => createDirectory(path.join(spacePath, 'documents')),
        () => createDirectory(path.join(spacePath, 'applications')),
        () => createSpaceStatus(spacePath, spaceObj),
        () => linkSpaceToUser(userId, spaceId),
        () => addSpaceToSpaceMap(spaceId, spaceName),
    ].concat(apiKey ? [() => saveSpaceAPIKeySecret(spaceId, apiKey)] : []);

    const results = await Promise.allSettled(filesPromises.map(fn => fn()));
    const failed = results.filter(r => r.status === 'rejected');

    if (failed.length > 0) {
        await rollback(spacePath);
        const error = new Error(failed.map(op => op.reason?.message || 'Unknown error').join(', '));
        error.statusCode = 500;
        throw error;
    }
    return spaceObj;
}


async function copySpaceStatus(spacePath, spaceObject) {
    await createDirectory(path.join(spacePath, 'status'));
    const statusPath = path.join(spacePath, 'status', 'status.json');
    await fsPromises.writeFile(statusPath, JSON.stringify(spaceObject, null, 2));
}


async function addObject(spaceId, objectType, objectData) {
    if (!SPACE_CONSTANTS.OBJECT_TYPES[objectType]) {
        throw new Error(`Invalid object type: ${objectType}`);
    }
    if (!documentAPIs[SPACE_CONSTANTS.OBJECT_TYPES[objectType]]["add"]) {
        throw new Error(`No ADD API found for object type: ${objectType}`);
    }
    return await documentAPIs[SPACE_CONSTANTS.OBJECT_TYPES[objectType]]["add"](spaceId, objectData);
}

async function updateObject() {

}

async function deleteObject() {

}

async function getSpaceDocumentsObject(spaceId) {

    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    try {
        let records = await $$.promisify(lightDBEnclaveClient.getAllRecords)($$.SYSTEM_IDENTIFIER, 'documents');
        let documentIds = records.map(record => record.data);
        for (let documentId of documentIds) {
            let document = await $$.promisify(lightDBEnclaveClient.getAllRecords)($$.SYSTEM_IDENTIFIER, documentId);
            console.log(document);
        }
    } catch (e) {
        console.log(e + "no documents yet");
    }

    const spacePath = path.join(__dirname, '../../../', SPACE_FOLDER_PATH, spaceId);
    const documentsDirectoryPath = path.join(spacePath, 'documents');


    const documentsFiles = await fsPromises.readdir(documentsDirectoryPath, {withFileTypes: true});

    const sortedDocumentsFiles = await sortFiles(documentsFiles, documentsDirectoryPath, 'creationDate');

    let spaceDocumentsObject = [];

    for (const fileName of sortedDocumentsFiles) {
        const documentJson = await fsPromises.readFile(path.join(documentsDirectoryPath, fileName), 'utf8');
        spaceDocumentsObject.push(JSON.parse(documentJson));
    }

    return spaceDocumentsObject;

}

async function getSpacePersonalitiesObject(spaceId) {

    const spacePath = path.join(__dirname, '../../../', SPACE_FOLDER_PATH, spaceId);
    const personalitiesDirectoryPath = path.join(spacePath, 'personalities');

    const personalitiesFiles = await fsPromises.readdir(personalitiesDirectoryPath, {withFileTypes: true});

    const sortedPersonalitiesFiles = await sortFiles(personalitiesFiles, personalitiesDirectoryPath, 'creationDate');

    let spacePersonalitiesObject = [];

    for (const fileName of sortedPersonalitiesFiles) {
        const personalityJson = await fsPromises.readFile(path.join(personalitiesDirectoryPath, fileName), 'utf8');
        spacePersonalitiesObject.push(JSON.parse(personalityJson));
    }

    return spacePersonalitiesObject;

}


async function getSpacesMap() {
    const spacesMapPath = path.join(__dirname, '../../../', SPACE_MAP_PATH);
    let spacesMapObject = JSON.parse(await fsPromises.readFile(spacesMapPath, 'utf8'));
    return spacesMapObject;
}


async function getSpaceStatusObject(spaceId) {
    const spacePath = path.join(__dirname, '../../../', `${SPACE_FOLDER_PATH}`, `${spaceId}`);
    const spaceStatusPath = path.join(spacePath, 'status', `status.json`);
    let spaceObjectJsonString = "";
    try {
        spaceObjectJsonString = await fsPromises.readFile(spaceStatusPath, {encoding: 'utf8'});
    } catch (error) {
        error.message = `Space ${spaceId} not found.`;
        error.statusCode = 404;
        throw error;
    }
    let spaceStatusObject = {};
    try {
        spaceStatusObject = JSON.parse(spaceObjectJsonString);
    } catch (error) {
        error.message = `Corrupted space file for Space: ${spaceId}.`;
        error.statusCode = 500;
        throw error;
    }
    return spaceStatusObject
}


async function saveSpaceAPIKeySecret(spaceId, apiKey) {
    const apihub = require('apihub');
    const secretsService = await apihub.getSecretsServiceInstanceAsync(SERVER_ROOT_FOLDER);
    const containerName = `${spaceId}.APIKey`
    const keyValidation = await validateOpenAIKey(apiKey);
    if (keyValidation) {
        await secretsService.putSecretAsync(containerName, "OpenAiAPIKey", apiKey);
    }
}

async function storeSpaceSecret(spaceId, secret) {
}


async function updateSpaceStatus(spaceId, spaceStatusObject) {
    const spacePath = path.join(__dirname, '../../../', SPACE_FOLDER_PATH, spaceId);
    const spaceStatusPath = path.join(spacePath, 'status', `status.json`);
    const spaceStatusJson = JSON.stringify(spaceStatusObject);
    await fsPromises.writeFile(spaceStatusPath, spaceStatusJson, {encoding: 'utf8'});
}




