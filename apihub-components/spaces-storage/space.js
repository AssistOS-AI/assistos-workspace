const path = require('path');
const fsPromises = require('fs').promises;
const archiver = require('archiver');
const enclave = require('opendsu').loadAPI('enclave');
const {pipeline} = require('stream');
const util = require('util');
const pipelineAsync = util.promisify(pipeline);
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

function getSpaceFolderPath() {
    return volumeManager.paths.space;
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

async function copyDefaultPersonalities(spacePath) {

    const defaultPersonalitiesPath = volumeManager.paths.defaultPersonalities;
    const personalitiesPath = path.join(spacePath, 'personalities');

    await file.createDirectory(personalitiesPath);

    const files = await fsPromises.readdir(defaultPersonalitiesPath);
    let metadata = [];
    for (const file of files) {
        const filePath = path.join(defaultPersonalitiesPath, file);
        let personality = JSON.parse(await fsPromises.readFile(filePath, 'utf8'));
        const destFilePath = path.join(personalitiesPath, file);
        await fsPromises.copyFile(filePath, destFilePath);
        let metaObj = {};
        for (let key of personality.metadata) {
            metaObj[key] = personality[key];
        }
        metaObj.fileName = file;
        metadata.push(metaObj);
    }
    await fsPromises.writeFile(path.join(spacePath, 'personalities', 'metadata.json'), JSON.stringify(metadata), 'utf8');
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

async function createSpace(spaceName, userId, apiKey) {
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
    let OpenAPIKeyObj = {};
    if (apiKey) {
        await openAI.confirmOpenAiKeyValidation(apiKey);
        OpenAPIKeyObj = {
            ownerId: userId,
            APIkey: apiKey,
            addedDate: date.getCurrentUTCDate()
        };
    }
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
            defaultSpaceAgentId: "2idYvpTEKXM5",
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
        () => copyDefaultPersonalities(spacePath),
        () => file.createDirectory(path.join(spacePath, 'documents')),
        () => file.createDirectory(path.join(spacePath, 'images')),
        () => file.createDirectory(path.join(spacePath, 'audios')),
        () => file.createDirectory(path.join(spacePath, 'applications')),
        () => file.createDirectory(path.join(spacePath, 'videos')),
        () => createSpaceStatus(spacePath, spaceObj),
        () => User.APIs.linkSpaceToUser(userId, spaceId),
        () => addSpaceToSpaceMap(spaceId, spaceName),
    ].concat(apiKey ? [() => secrets.putSpaceKey(spaceId, "OpenAI", OpenAPIKeyObj)] : []);

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

async function uninstallApplication(spaceId, appName) {
    const spaceStatusObject = await getSpaceStatusObject(spaceId);
    spaceStatusObject.installedApplications = spaceStatusObject.installedApplications.filter(application => application.name !== appName);
    await updateSpaceStatus(spaceId, spaceStatusObject);
    await fsPromises.rm(getApplicationPath(spaceId, appName), {recursive: true, force: true});
}


async function getSpacesPendingInvitationsObject() {
    const path = getSpacePendingInvitationsPath();
    return JSON.parse(await fsPromises.readFile(path, 'utf8'));
}

async function updateSpacePendingInvitations(spaceId, pendingInvitationsObject) {
    const path = getSpacePendingInvitationsPath();
    await fsPromises.writeFile(path, JSON.stringify(pendingInvitationsObject, null, 2), 'utf8');
}

async function getAPIKey(spaceId, modelName) {

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

async function putImage(spaceId, imageId, imageData) {
    return await Storage.insertImage(spaceId, imageId, imageData);
}

async function getImage(spaceId, imageId) {
    return await Storage.getImage(spaceId, imageId);
}

function getImageStream(spaceId, imageId) {
    return Storage.getImageStream(spaceId, imageId);
}

async function deleteImage(spaceId, imageId) {
    return Storage.deleteImage(spaceId, imageId);
}

async function putAudio(spaceId, audioId, audioData) {
    return await Storage.insertAudio(spaceId, audioId, audioData);
}

async function getAudio(spaceId, audioId) {
    return await Storage.getAudio(spaceId, audioId);
}

function getAudioStream(spaceId, audioId) {
    return Storage.getAudioStream(spaceId, audioId);
}

async function deleteAudio(spaceId, audioId) {
    return Storage.deleteAudio(spaceId, audioId);
}


async function putVideo(spaceId, videoId, dataSource) {
    return await Storage.insertVideo(spaceId, videoId, dataSource);
}

async function getVideo(spaceId, videoId) {
    return await Storage.getVideo(spaceId, videoId);
}

function getVideoStream(spaceId, videoId) {
    return Storage.getVideoStream(spaceId, videoId);
}

async function getVideoParts(response, spaceId, videoId, range) {
    const videosPath = path.join(getSpacePath(spaceId), 'videos');
    const videoPath = path.join(videosPath, `${videoId}.mp4`);
    const stat = await fs.promises.stat(videoPath);
    const fileSize = stat.size;
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const DEFAULT_CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB

    const end = Math.min(start + DEFAULT_CHUNK_SIZE - 1, fileSize - 1);
    const chunkSize = (end - start) + 1;

    const fileStream = fs.createReadStream(videoPath, {start, end});
    const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
    };
    response.writeHead(206, head); // Partial Content
    await pipelineAsync(fileStream, response);

}

async function deleteVideo(spaceId, videoId) {
    return Storage.deleteVideo(spaceId, videoId);
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
    let imageStream = await Storage.getImageStream(spaceId, personalityData.imageId);
    archive.append(imageStream, {name: `${personalityData.imageId}.png`});

    archive.finalize();
    return stream;
}

async function importPersonality(spaceId, extractedPath, request) {
    const personalityDataPath = path.join(extractedPath, 'data.json');

    const SecurityContext = require("assistos").ServerSideSecurityContext;
    let securityContext = new SecurityContext(request);
    let spaceModule = require("assistos").loadModule("space", securityContext);
    let personalityModule = require("assistos").loadModule("personality", securityContext);
    const personalityDataStream = fs.createReadStream(personalityDataPath, 'utf8');


    const personalityData = await streamToJson(personalityDataStream);
    const spacePersonalities = await getSpacePersonalitiesObject(spaceId);

    const personalityImagePath = path.join(extractedPath, `${personalityData.imageId}.png`);
    let image = await readFileAsBuffer(personalityImagePath);
    await spaceModule.addImage(spaceId, personalityData.imageId, image);
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

async function getPersonalityByName(spaceId, personalityName) {
    const personalities = await getSpacePersonalitiesObject(spaceId);
    return personalities.find(personality => personality.name === personalityName);
}

module.exports = {
    APIs: {
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
        uninstallApplication,
        getSpaceChat,
        addSpaceChatMessage,
        getSpaceName,
        getAPIKey,
        editAPIKey,
        deleteAPIKey,
        getAPIKeysMetadata,
        getSpaceAgent,
        getDefaultSpaceAgentId,
        putImage,
        getImage,
        deleteImage,
        putAudio,
        getAudio,
        deleteAudio,
        getSpacePath,
        getVideo,
        deleteVideo,
        getAudioStream,
        getVideoStream,
        getImageStream,
        archivePersonality,
        importPersonality,
        getVideoParts,
        putVideo,
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

