const path = require('path');
const fsPromises = require('fs').promises;

const config = require('../config.json');

const volumeManager = require('../volumeManager.js');

const constants = require('assistos-sdk').constants;

const documentModule = require('assistos-sdk').loadModule('document');

const documentAPIs = documentModule.loadAPIs();

const enclave = require('opendsu').loadAPI('enclave');

const crypto = require("../apihub-component-utils/crypto");
const data = require('../apihub-component-utils/data.js');
const date = require('../apihub-component-utils/date.js');
const file = require('../apihub-component-utils/file.js');
const openAI = require('../apihub-component-utils/openAI.js');


function getSpacePath(spaceId) {
    return path.join(volumeManager.paths.space, spaceId);
}

function getSpaceFolderPath() {
    return volumeManager.paths.space;
}

function getSpaceMapPath() {
    return volumeManager.paths.spaceMap;
}

async function updateSpaceMap(spaceMapObject) {
    await fsPromises.writeFile(getSpaceMapPath(), JSON.stringify(spaceMapObject, null, 2), 'utf8');
}

async function getSpaceMap() {
    const spaceMapPath = getSpaceMapPath();
    return JSON.parse(await fsPromises.readFile(spaceMapPath, 'utf8'));
}

async function addAnnouncement(spaceId, announcementObject) {
    const spaceStatusObject = getSpaceStatusObject(spaceId)
    spaceStatusObject.announcements.push(announcementObject)
    await updateSpaceStatus(spaceStatusObject);
}

async function addSpaceToSpaceMap(spaceId, spaceName) {
    let spacesMapObject = await getSpaceMap();

    if (spacesMapObject.hasOwnProperty(spaceId)) {
        throw new Error(`Space with id ${spaceId} already exists`);
    } else {
        spacesMapObject[spaceId] = spaceName;
    }
    await updateSpaceMap(spacesMapObject);
}

async function copyDefaultFlows(spacePath) {

    const defaultFlowsPath = volumeManager.paths.defaultFlows;
    const flowsPath = path.join(spacePath, 'flows');
    await file.createDirectory(flowsPath);

    const files = await fsPromises.readdir(defaultFlowsPath);

    for (const file of files) {
        const filePath = path.join(defaultFlowsPath, file);
        const destFilePath = path.join(flowsPath, file);
        await fsPromises.copyFile(filePath, destFilePath);
    }
}

async function copyDefaultPersonalities(spacePath) {

    const defaultPersonalitiesPath = volumeManager.paths.defaultPersonalities;
    const personalitiesPath = path.join(spacePath, 'personalities');

    await file.createDirectory(personalitiesPath);

    const files = await fsPromises.readdir(defaultPersonalitiesPath);

    for (const file of files) {
        const filePath = path.join(defaultPersonalitiesPath, file);
        const destFilePath = path.join(personalitiesPath, file);
        await fsPromises.copyFile(filePath, destFilePath);
    }
}

function createDefaultAnnouncement(spaceName) {
    const defaultSpaceAnnouncement= require('./templates/defaultSpaceAnnouncement.json');
    const currentDate = date.getCurrentUTCDate();
    const announcementId = crypto.generateId();
    return data.fillTemplate(defaultSpaceAnnouncement,
        {
            announcementId: announcementId,
            spaceName: spaceName,
            currentUTCDate: currentDate
        })
}

async function createSpace(spaceName, userId, apiKey) {
    const defaultSpaceTemplate= require('./templates/defaultSpaceTemplate.json');
    const defaultApiKeyTemplate= require('./templates/defaultApiKeyTemplate.json');
    const spaceValidationSchema= require('./templates/spaceValidationSchema.json');

    const User=require('../users-storage/user.js');
    const rollback = async (spacePath) => {
        try {
            await fsPromises.rm(spacePath, {recursive: true, force: true});
        } catch (error) {
            console.error(`Failed to clean up space directory at ${spacePath}: ${error}`);
            throw error;
        }
    };

    const spaceId = crypto.generateId();
    let spaceObj = {}
    try {
        spaceObj = data.fillTemplate(defaultSpaceTemplate, {
            spaceName: spaceName,
            spaceId: spaceId,
            adminId: userId,
            apiKey: apiKey ? data.fillTemplate(defaultApiKeyTemplate, {
                keyType: "OpenAI",
                ownerId: userId,
                keyId: crypto.generateId(),
                keyValue: openAI.maskKey(apiKey)
            }) : undefined,
            defaultAnnouncement: createDefaultAnnouncement(spaceName),
            creationDate: date.getCurrentUTCDate()
        });
    } catch (error) {
        error.message = 'Error creating space';
        error.statusCode = 500;
        throw error;
    }
    let spaceValidationResult = {};
    try {
        spaceValidationResult = data.validateObject(spaceValidationSchema, spaceObj);
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

    const spacePath = getSpacePath(spaceId);

    await file.createDirectory(spacePath);
    const filesPromises = [
        () => copyDefaultFlows(spacePath),
        () => copyDefaultPersonalities(spacePath),
        () => file.createDirectory(path.join(spacePath, 'documents')),
        () => file.createDirectory(path.join(spacePath, 'applications')),
        () => createSpaceStatus(spacePath, spaceObj),
        () => User.APIs.linkSpaceToUser(userId, spaceId),
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
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    await $$.promisify(lightDBEnclaveClient.createDatabase)(spaceId);
    await $$.promisify(lightDBEnclaveClient.grantWriteAccess)($$.SYSTEM_IDENTIFIER);
    return spaceObj;
}

async function createSpaceStatus(spacePath, spaceObject) {
    await file.createDirectory(path.join(spacePath, 'status'));
    const statusPath = path.join(spacePath, 'status', 'status.json');
    await fsPromises.writeFile(statusPath, JSON.stringify(spaceObject, null, 2));
}

async function deleteSpace() {

}

async function getSpaceDocumentsObject(spaceId) {
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let documents = [];
    let records;
    try {
        records = await $$.promisify(lightDBEnclaveClient.getAllRecords)($$.SYSTEM_IDENTIFIER, 'documents');
    } catch (e) {
        console.log(e + "no documents yet");
        return documents;
    }
    let documentIds = records.map(record => record.data);
    for (let documentId of documentIds) {
        documents.push(documentAPIs.document.get(spaceId, documentId));
    }
    documents = await Promise.all(documents);
    documents.sort((a, b) => a.position - b.position);
    return documents;
}


async function getSpacePersonalitiesObject(spaceId) {

    const personalitiesDirectoryPath = path.join(getSpacePath(spaceId), 'personalities');

    const personalitiesFiles = await fsPromises.readdir(personalitiesDirectoryPath, {withFileTypes: true});

    const sortedPersonalitiesFiles = await file.sortFiles(personalitiesFiles, personalitiesDirectoryPath, 'creationDate');

    let spacePersonalitiesObject = [];

    for (const fileName of sortedPersonalitiesFiles) {
        const personalityJson = await fsPromises.readFile(path.join(personalitiesDirectoryPath, fileName), 'utf8');
        spacePersonalitiesObject.push(JSON.parse(personalityJson));
    }
    return spacePersonalitiesObject;

}

async function getSpaceStatusObject(spaceId) {
    const spaceStatusPath = path.join(getSpacePath(spaceId), 'status', 'status.json');
    try {
        const spaceStatusObject = JSON.parse(await fsPromises.readFile(spaceStatusPath, {encoding: 'utf8'}));
        return spaceStatusObject
    } catch (error) {
        error.message = `Space ${spaceId} not found.`;
        error.statusCode = 404;
        throw error;
    }
}

async function saveSpaceAPIKeySecret(spaceId, apiKey) {
    const apihub = require('apihub');

    const secretsService = await apihub.getSecretsServiceInstanceAsync(config.SERVER_ROOT_FOLDER);
    const containerName = `${spaceId}.APIKey`
    const keyValidation = await openAI.validateOpenAiKey(apiKey);
    if (keyValidation) {
        await secretsService.putSecretAsync(containerName, "OpenAiAPIKey", apiKey);
    }
}

async function storeSpaceSecret(spaceId, secret) {
}

async function updateSpaceStatus(spaceId, spaceStatusObject) {
    const spacePath = getSpacePath(spaceId)
    const spaceStatusPath = path.join(spacePath, 'status', `status.json`);
    await fsPromises.writeFile(spaceStatusPath, JSON.stringify(spaceStatusObject, null, 2), {encoding: 'utf8'});
}

async function getObject(spaceId, objectType, objectId) {
    if (!constants.OBJECT_TYPES[objectType]) {
        throw new Error(`Invalid object type: ${objectType}`);
    }
    if (!documentAPIs[constants.OBJECT_TYPES[objectType]]["get"]) {
        throw new Error(`No ADD API found for object type: ${objectType}`);
    }
    return await documentAPIs[constants.OBJECT_TYPES[objectType]]["get"](spaceId, objectId);
}

async function addObject(spaceId, objectType, objectData) {
    if (!constants.OBJECT_TYPES[objectType]) {
        throw new Error(`Invalid object type: ${objectType}`);
    }
    if (!documentAPIs[constants.OBJECT_TYPES[objectType]]["add"]) {
        throw new Error(`No ADD API found for object type: ${objectType}`);
    }
    return await documentAPIs[constants.OBJECT_TYPES[objectType]]["add"](spaceId, objectData);
}

async function updateObject(spaceId, objectType, objectId, objectData) {
    if (!constants.OBJECT_TYPES[objectType]) {
        throw new Error(`Invalid object type: ${objectType}`);
    }
    if (!documentAPIs[constants.OBJECT_TYPES[objectType]]["update"]) {
        throw new Error(`No ADD API found for object type: ${objectType}`);
    }
    return await documentAPIs[constants.OBJECT_TYPES[objectType]]["update"](spaceId, objectId, objectData);
}

async function deleteObject(spaceId, objectType, objectId) {
    if (!constants.OBJECT_TYPES[objectType]) {
        throw new Error(`Invalid object type: ${objectType}`);
    }
    if (!documentAPIs[constants.OBJECT_TYPES[objectType]]["delete"]) {
        throw new Error(`No ADD API found for object type: ${objectType}`);
    }
    return await documentAPIs[constants.OBJECT_TYPES[objectType]]["delete"](spaceId, objectId);
}

module.exports = {
    APIs: {
        addAnnouncement,
        addSpaceToSpaceMap,
        copyDefaultFlows,
        copyDefaultPersonalities,
        createDefaultAnnouncement,
        createSpace,
        createSpaceStatus,
        addObject,
        updateObject,
        deleteObject,
        getSpaceDocumentsObject,
        getSpacePersonalitiesObject,
        getSpaceMap,
        getSpaceStatusObject,
        saveSpaceAPIKeySecret,
        storeSpaceSecret,
        updateSpaceStatus,
        deleteSpace
    },
    templates: {
        defaultApiKeyTemplate:require('./templates/defaultApiKeyTemplate.json'),
        defaultSpaceAnnouncement:require('./templates/defaultSpaceAnnouncement.json'),
        defaultSpaceNameTemplate:require('./templates/defaultSpaceNameTemplate.json'),
        defaultSpaceTemplate:require('./templates/defaultSpaceTemplate.json'),
        spaceValidationSchema:require('./templates/spaceValidationSchema.json')
    }
}

