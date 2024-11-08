const path = require('path');
const fsPromises = require('fs').promises;
const archiver = require('archiver');
const enclave = require('opendsu').loadAPI('enclave');
const crypto = require("../apihub-component-utils/crypto");
const data = require('../apihub-component-utils/data.js');
const date = require('../apihub-component-utils/date.js');
const file = require('../apihub-component-utils/file.js');
const openAI = require('../apihub-component-utils/openAI.js');
const secrets = require('../apihub-component-utils/secrets.js');
const fs = require('fs');
const spaceConstants = require('./constants.js');
const volumeManager = require('../volumeManager.js');
const Storage = require('../apihub-component-utils/storage.js');

function getSpacePath(spaceId) {
    return path.join(volumeManager.paths.space, spaceId);
}

function getSpaceMapPath() {
    return volumeManager.paths.spaceMap;
}

function getSpacePendingInvitationsPath() {
    return volumeManager.paths.spacePendingInvitations;
}

async function updateSpaceMap(spaceMapObject) {
    await fsPromises.writeFile(getSpaceMapPath(), JSON.stringify(spaceMapObject, null, 2), 'utf8');
}

async function getSpaceMap() {
    const spaceMapPath = getSpaceMapPath();
    return JSON.parse(await fsPromises.readFile(spaceMapPath, 'utf8'));
}

async function addSpaceAnnouncement(spaceId, announcementObject) {
    const spaceStatusObject = await getSpaceStatusObject(spaceId)
    announcementObject.date = date.getCurrentUTCDate();
    announcementObject.id = crypto.generateId();
    spaceStatusObject.announcements.push(announcementObject)
    await updateSpaceStatus(spaceId, spaceStatusObject);
    return announcementObject.id;
}

async function getSpaceAnnouncement(spaceId, announcementId) {
    const spaceStatusObject = await getSpaceStatusObject(spaceId)
    const announcement = spaceStatusObject.announcements.find(announcement => announcement.id === announcementId);
    if (announcement) {
        return announcement;
    } else {
        const error = new Error(`Announcement with id ${announcementId} not found`);
        error.statusCode = 404;
        throw error;
    }
}

async function getSpaceAnnouncements(spaceId) {
    const spaceStatusObject = await getSpaceStatusObject(spaceId)
    return spaceStatusObject.announcements;
}

async function updateSpaceAnnouncement(spaceId, announcementId, announcementData) {
    const spaceStatusObject = await getSpaceStatusObject(spaceId)
    const announcementIndex = spaceStatusObject.announcements.findIndex(announcement => announcement.id === announcementId);
    if (announcementIndex === -1) {
        const error = new Error(`Announcement with id ${announcementId} not found`);
        error.statusCode = 404;
        throw error
    }
    spaceStatusObject.announcements[announcementIndex].title = announcementData.title;
    spaceStatusObject.announcements[announcementIndex].text = announcementData.text;
    spaceStatusObject.announcements[announcementIndex].lastUpdated = date.getCurrentUTCDate();
    await updateSpaceStatus(spaceId, spaceStatusObject);
}

async function deleteSpaceAnnouncement(spaceId, announcementId) {
    const spaceStatusObject = await getSpaceStatusObject(spaceId);
    const announcementIndex = spaceStatusObject.announcements.findIndex(announcement => announcement.id === announcementId);
    if (announcementIndex === -1) {
        const error = new Error(`Announcement with id ${announcementId} not found`);
        error.statusCode = 404;
        throw error
    }
    spaceStatusObject.announcements.splice(announcementIndex, 1);
    await updateSpaceStatus(spaceId, spaceStatusObject);
    return announcementId;
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

async function copyDefaultPersonalities(spacePath, spaceId, defaultSpaceAgentId, spaceModule) {

    const defaultPersonalitiesPath = volumeManager.paths.defaultPersonalities;
    const personalitiesPath = path.join(spacePath, 'personalities');

    await file.createDirectory(personalitiesPath);
    const files = await fsPromises.readdir(defaultPersonalitiesPath, { withFileTypes: true });
    let metadata = [];
    let promises = [];
    for (const entry of files) {
        if (entry.isFile()) {
            promises.push(preparePersonalityData(defaultPersonalitiesPath , personalitiesPath, entry, spaceId, defaultSpaceAgentId, spaceModule));
        }
    }
    metadata = await Promise.all(promises);
    await fsPromises.writeFile(path.join(spacePath, 'personalities', 'metadata.json'), JSON.stringify(metadata), 'utf8');
}
async function preparePersonalityData(defaultPersonalitiesPath, personalitiesPath, entry, spaceId, defaultSpaceAgentId, spaceModule) {
    const filePath = path.join(defaultPersonalitiesPath, entry.name);
    let personality = JSON.parse(await fsPromises.readFile(filePath, 'utf8'));
    const constants = require("assistos").constants;
    if(personality.name === constants.DEFAULT_PERSONALITY_NAME){
        personality.id = defaultSpaceAgentId;
    } else {
        personality.id = crypto.generateId(16);
    }
    let imagesPath = path.join(defaultPersonalitiesPath, 'images');
    let imageBuffer = await fsPromises.readFile(path.join(imagesPath, `${personality.imageId}.png`));

    personality.imageId = await spaceModule.putImage(imageBuffer);
    await fsPromises.writeFile(path.join(personalitiesPath, `${personality.id}.json`), JSON.stringify(personality), 'utf8');

    return {
        id: personality.id,
        name: personality.name,
        imageId: personality.imageId,
    };
}
async function getPersonalitiesIds(spaceId, personalityNames) {
    const personalityIds = [];
    const personalityPath = path.join(getSpacePath(spaceId), 'personalities', 'metadata.json');
    const personalitiesData = JSON.parse(await fsPromises.readFile(personalityPath, 'utf8'));
    for (let personality of personalitiesData) {
        if (personalityNames.has(personality.name)) {
            personalityIds.push(personality.id);
        }
    }
    return personalityIds;
}

function createDefaultAnnouncement(spaceName) {
    const defaultSpaceAnnouncement = require('./templates/defaultSpaceAnnouncement.json');
    const currentDate = date.getCurrentUTCDate();
    const announcementId = crypto.generateId();
    return data.fillTemplate(defaultSpaceAnnouncement,
        {
            announcementId: announcementId,
            spaceName: spaceName,
            currentUTCDate: currentDate
        })
}

async function createSpace(spaceName, userId, spaceModule) {
    const defaultSpaceTemplate = require('./templates/defaultSpaceTemplate.json');
    const spaceValidationSchema = require('./templates/spaceValidationSchema.json');

    const User = require('../users-storage/user.js');
    const rollback = async (spacePath) => {
        try {
            await fsPromises.rm(spacePath, {recursive: true, force: true});
        } catch (error) {
            console.error(`Failed to clean up space directory at ${spacePath}: ${error}`);
            throw error;
        }
    };

    const spaceId = crypto.generateId();
    let spaceObj = {};
    const defaultSpaceAgentId = crypto.generateId(16);
    try {
        spaceObj = data.fillTemplate(defaultSpaceTemplate, {
            spaceName: spaceName,
            spaceId: spaceId,
            admin: {
                [userId]: {
                    roles: [spaceConstants.spaceRoles.Admin, spaceConstants.spaceRoles.Owner],
                    joinDate: date.getCurrentUnixTime()
                }
            },
            defaultSpaceAgentId: defaultSpaceAgentId,
            defaultAnnouncement: createDefaultAnnouncement(spaceName),
            creationDate:
                date.getCurrentUTCDate()
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
    await secrets.createSpaceSecretsContainer(spaceId);

    const filesPromises = [
        () => copyDefaultFlows(spacePath),
        () => copyDefaultPersonalities(spacePath, spaceId, defaultSpaceAgentId, spaceModule),
        () => file.createDirectory(path.join(spacePath, 'documents')),
        () => file.createDirectory(path.join(spacePath, 'applications')),
        () => createSpaceStatus(spacePath, spaceObj),
        () => User.linkSpaceToUser(userId, spaceId),
        () => addSpaceToSpaceMap(spaceId, spaceName),
    ];

    const results = await Promise.allSettled(filesPromises.map(fn => fn()));
    const failed = results.filter(r => r.status === 'rejected');

    if (failed.length > 0) {
        await rollback(spacePath);
        const error = new Error(failed.map(op => op.reason?.message || 'Unknown error').join(', '));
        error.statusCode = 500;
        throw error;
    }
    const lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    await $$.promisify(lightDBEnclaveClient.createDatabase)(spaceId);
    await $$.promisify(lightDBEnclaveClient.grantWriteAccess)($$.SYSTEM_IDENTIFIER);
    await createDefaultSpaceChats(lightDBEnclaveClient, spaceId, spaceName);
    return spaceObj;
}

async function getSpaceChat(spaceId) {
    const lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    const tableName = `chat_${spaceId}`
    let records = await $$.promisify(lightDBEnclaveClient.filter)($$.SYSTEM_IDENTIFIER, tableName);
    let chat = []
    for (let record of records) {
        chat.push({
            role: record.data.role,
            message: record.data.message,
            date: date.parseUnixDate(record.__timestamp),
            user: record.data.user
        })
    }
    return chat;
}

async function addSpaceChatMessage(spaceId, entityId, role, messageData) {
    const aosUtil = require('assistos').loadModule('util', {});
    messageData = aosUtil.sanitize(messageData);
    const lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    const messageId = crypto.generateId();
    const tableName = `chat_${spaceId}`
    const primaryKey = `chat_${spaceId}_${entityId}_${messageId}`
    await lightDBEnclaveClient.insertRecord($$.SYSTEM_IDENTIFIER, tableName, primaryKey, {
        data: {
            role: role,
            message: messageData,
            messageId: messageId,
            user: entityId
        }
    })
    return messageId
}

async function createDefaultSpaceChats(lightDBEnclaveClient, spaceId, spaceName) {
    const createWorkspaceChat = async () => {
        const tableName = `chat_${spaceId}`;
        const entryMessagePk = `chat_${spaceId}`;
        const entryMessage = `Welcome to ${spaceName}! This is the workspace chat where you can discuss and collaborate with your team members.`
        await lightDBEnclaveClient.insertRecord($$.SYSTEM_IDENTIFIER, tableName, entryMessagePk, {
            data: {
                role: "Space",
                message: entryMessage,
            }
        })
    }
    await createWorkspaceChat();
}

async function getSpacePersonalities(spaceId) {
    const personalitiesFolder = path.join(getSpacePath(spaceId), 'personalities');
    const personalities = {};

    try {
        const files = await fsPromises.readdir(personalitiesFolder);
        for (const file of files) {
            const filePath = path.join(personalitiesFolder, file);
            const data = await fsPromises.readFile(filePath, 'utf8');
            const personality = JSON.parse(data);
            personalities[personality.id] = {
                name: personality.name,
                description: personality.description,
                metadata: personality.metadata,
                image: personality.image,
                welcomingMessage: `Welcome! As a ${personality.name}, I'm here to help you navigate and thrive in this space.`
            };
        }
    } catch (error) {
        console.error('Failed to read directory or file:', error);
    }
    return personalities;
}

async function getPersonalityData(spaceId, personalityId) {
    const personalityPath = path.join(getSpacePath(spaceId), 'personalities', `${personalityId}.json`);
    try {
        const personalityData = await fsPromises.readFile(personalityPath, 'utf8');
        return JSON.parse(personalityData);
    } catch (error) {
        error.message = `Personality ${personalityId} not found.`;
        error.statusCode = 404;
        throw error;
    }
}

async function createSpaceStatus(spacePath, spaceObject) {
    await file.createDirectory(path.join(spacePath, 'status'));
    const statusPath = path.join(spacePath, 'status', 'status.json');
    await fsPromises.writeFile(statusPath, JSON.stringify(spaceObject, null, 2));
}

async function deleteSpace(userId, spaceId) {
    let user = require('../users-storage/user.js');
    const documentService = require("../document/services/document");
    let userFile = await user.getUserFile(userId);
    let spacesNr = Object.keys(userFile.spaces).length;
    if(spacesNr === 1){
        return "You can't delete your last space";
    }
    let spaceStatus = await getSpaceStatusObject(spaceId);
    if(!spaceStatus.admins[userId]){
        return "You dont have permission to delete this space";
    }
    //unlink space from all users
    for(let userId of Object.keys(spaceStatus.users)){
        await user.unlinkSpaceFromUser(userId, spaceId);
    }
    //delete space folder
    let spacePath = getSpacePath(spaceId);
    await fsPromises.rm(spacePath, {recursive: true, force: true});
    //delete documents
    let documentsList = await documentService.getDocumentsMetadata(spaceId);
    for(let document of documentsList){
        await documentService.deleteDocument(spaceId, document.id);
    }
    //delete api keys
    let keys = await secrets.getAPIKeys(spaceId);
    for(let keyType in keys){
        await secrets.deleteSpaceKey(spaceId, keyType);
    }
    //delete chat
    //TODO delete lightdb chat and folder
}

async function getSpaceName(spaceId) {
    const spaceMap = await getSpaceMap();
    return spaceMap[spaceId];
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

function getApplicationPath(spaceId, appName) {
    return path.join(getSpacePath(spaceId), 'applications', appName);
}

async function updateSpaceStatus(spaceId, spaceStatusObject) {
    const spacePath = getSpacePath(spaceId)
    const spaceStatusPath = path.join(spacePath, 'status', `status.json`);
    await fsPromises.writeFile(spaceStatusPath, JSON.stringify(spaceStatusObject, null, 2), {encoding: 'utf8'});
}



async function getSpacesPendingInvitationsObject() {
    const path = getSpacePendingInvitationsPath();
    return JSON.parse(await fsPromises.readFile(path, 'utf8'));
}

async function updateSpacePendingInvitations(pendingInvitationsObject) {
    const path = getSpacePendingInvitationsPath();
    await fsPromises.writeFile(path, JSON.stringify(pendingInvitationsObject, null, 2), 'utf8');
}

async function editAPIKey(spaceId, userId, APIkeyObj) {
    const {getLLMConfigs} = require('../llms/controller.js');
    let LLMConfigs = await getLLMConfigs();
    let companyObj = LLMConfigs.find((companyObj) => companyObj.company === APIkeyObj.type);
    let apiKeyObj = {
        ownerId: userId,
        addedDate: date.getCurrentUTCDate()
    }
    for (let key of companyObj.authentication) {
        apiKeyObj[key] = APIkeyObj[key];
    }
    await secrets.putSpaceKey(spaceId, APIkeyObj.type, apiKeyObj);
}

async function getAPIKeysMetadata(spaceId) {
    let keys = JSON.parse(JSON.stringify(await secrets.getAPIKeys(spaceId)));
    for (let keyType in keys) {
        if (keys[keyType].APIKey) {
            keys[keyType].APIKey = openAI.maskKey(keys[keyType].APIKey);
        }
        if (keys[keyType].userId) {
            keys[keyType].userId = openAI.maskKey(keys[keyType].userId);
        }
    }
    return keys;
}

function getAgentPath(spaceId, agentId) {
    return path.join(getSpacePath(spaceId), 'personalities', `${agentId}.json`);
}

async function deleteAPIKey(spaceId, keyType) {
    await secrets.deleteSpaceKey(spaceId, keyType);
}

async function getSpaceAgent(spaceId, agentId) {
    try {
        const agentPath = getAgentPath(spaceId, agentId);
        const agentObj = JSON.parse(await fsPromises.readFile(agentPath, 'utf8'));
        return agentObj;
    } catch (error) {
        error.message = `Agent ${agentId} not found.`;
        error.statusCode = 404;
        throw error;
    }
}

async function getDefaultSpaceAgentId(spaceId) {
    const spaceStatusObject = await getSpaceStatusObject(spaceId);
    return spaceStatusObject.defaultSpaceAgent;
}

async function streamToJson(stream) {
    return new Promise((resolve, reject) => {
        let data = '';
        stream.on('data', chunk => data += chunk);
        stream.on('end', () => resolve(JSON.parse(data)));
        stream.on('error', err => reject(err));
    });
}

async function readFileAsBuffer(filePath) {
    return new Promise((resolve, reject) => {
        let data = '';
        const stream = fs.createReadStream(filePath, {encoding: 'binary'});
        stream.on('data', chunk => data += chunk);
        stream.on('end', () => resolve(Buffer.from(data, "binary")));
        stream.on('error', err => reject(err));
    });
}

async function archivePersonality(spaceId, personalityId) {
    const personalityData = await getPersonalityData(spaceId, personalityId);
    const contentBuffer = Buffer.from(JSON.stringify(personalityData), 'utf-8');
    const checksum = require('crypto').createHash('sha256').update(contentBuffer).digest('hex');

    const metadata = {
        name: personalityData.name,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        version: "1.0",
        checksum: checksum,
        contentFile: "data.json",
    };

    const archive = archiver('zip', {zlib: {level: 9}});
    const stream = new require('stream').PassThrough();
    archive.pipe(stream);

    archive.append(contentBuffer, {name: 'data.json'});
    archive.append(Buffer.from(JSON.stringify(metadata), 'utf-8'), {name: 'metadata.json'});
    if(personalityData.imageId){
        let {fileStream, headers} = await Storage.getFile(Storage.fileTypes.images, personalityData.imageId);
        archive.append(fileStream, {name: `${personalityData.imageId}.png`});
    }

    archive.finalize();
    return stream;
}

async function importPersonality(spaceId, extractedPath, request) {
    const personalityDataPath = path.join(extractedPath, 'data.json');

    const SecurityContext = require("assistos").ServerSideSecurityContext;
    let securityContext = new SecurityContext(request);
    let personalityModule = require("assistos").loadModule("personality", securityContext);
    const personalityDataStream = fs.createReadStream(personalityDataPath, 'utf8');


    const personalityData = await streamToJson(personalityDataStream);
    const spacePersonalities = await getSpacePersonalitiesObject(spaceId);
    if(personalityData.imageId){
        const personalityImagePath = path.join(extractedPath, `${personalityData.imageId}.png`);
        let imageStream =  fs.createReadStream(personalityImagePath);
        await Storage.putFile(Storage.fileTypes.images, personalityData.imageId, imageStream);
    }
    const existingPersonality = spacePersonalities.find(personality => personality.name === personalityData.name);

    let personalityId, overriden = false, personalityName = personalityData.name;
    if (existingPersonality) {
        personalityData.id = existingPersonality.id;
        personalityId = await personalityModule.updatePersonality(spaceId, existingPersonality.id, personalityData);
        overriden = true;
    } else {
        personalityId = await personalityModule.addPersonality(spaceId, personalityData);
    }
    return {id: personalityId, overriden: overriden, name: personalityName};
}
async function addApplicationToSpaceObject(spaceId, applicationData,manifest){
    const spaceStatusObject = await getSpaceStatusObject(spaceId);
    spaceStatusObject.installedApplications.push({
        name: applicationData.name,
        description: manifest.description || "No description provided",
        installationDate: date.getCurrentUnixTimeSeconds(),
        lastUpdate: applicationData.lastUpdate,
        flowsBranch: applicationData.flowsRepository || "No flows repository provided"
    });
    await updateSpaceStatus(spaceId, spaceStatusObject);
}

async function removeApplicationFromSpaceObject(spaceId, applicationId){
    const spaceStatusObject = await getSpaceStatusObject(spaceId);
    spaceStatusObject.installedApplications = spaceStatusObject.installedApplications.filter(application => application.name !== applicationId);
    await updateSpaceStatus(spaceId, spaceStatusObject);
}

module.exports = {
    APIs: {
        addApplicationToSpaceObject,
        removeApplicationFromSpaceObject,
        addSpaceAnnouncement,
        getSpaceAnnouncement,
        getSpaceAnnouncements,
        updateSpaceAnnouncement,
        deleteSpaceAnnouncement,
        createSpace,
        getSpaceMap,
        getSpaceStatusObject,
        getSpacesPendingInvitationsObject,
        updateSpacePendingInvitations,
        updateSpaceStatus,
        deleteSpace,
        getSpaceChat,
        addSpaceChatMessage,
        getSpaceName,
        editAPIKey,
        deleteAPIKey,
        getAPIKeysMetadata,
        getSpaceAgent,
        getDefaultSpaceAgentId,
        getSpacePath,
        archivePersonality,
        importPersonality,
        getSpaceMapPath,
        getPersonalitiesIds,
        streamToJson,
        readFileAsBuffer
    },
    templates: {
        defaultSpaceAnnouncement: require('./templates/defaultSpaceAnnouncement.json'),
        defaultSpaceNameTemplate: require('./templates/defaultSpaceNameTemplate.json'),
        defaultSpaceTemplate: require('./templates/defaultSpaceTemplate.json'),
        spaceValidationSchema: require('./templates/spaceValidationSchema.json')
    },
    constants: require('./constants.js')
}

