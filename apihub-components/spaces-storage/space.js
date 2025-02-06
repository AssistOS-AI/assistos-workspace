const path = require('path');
const fsPromises = require('fs').promises;
const archiver = require('archiver');
const enclave = require('opendsu').loadAPI('enclave');
const crypto = require("../apihub-component-utils/crypto.js");
const data = require('../apihub-component-utils/data.js');
const date = require('../apihub-component-utils/date.js');
const file = require('../apihub-component-utils/file.js');
const openAI = require('../apihub-component-utils/openAI.js');
const secrets = require('../apihub-component-utils/secrets.js');
const lightDB = require('../apihub-component-utils/lightDB.js');
const fs = require('fs');
const spaceConstants = require('./constants.js');
const volumeManager = require('../volumeManager.js');
const Storage = require('../apihub-component-utils/storage.js');
const cookie = require("../apihub-component-utils/cookie");


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

async function ensureTasksFolderExists(spaceId) {
    const tasksFolderPath = path.join(getSpacePath(spaceId), 'tasks');
    try {
        await file.createDirectory(tasksFolderPath);
    } catch (error) {
        if (error.statusCode !== 409) {
            throw error;
        }
    }
}

async function ensureTaskFolderExists(spaceId, taskId) {
    await ensureTasksFolderExists(spaceId);
    const taskFolderPath = path.join(getSpacePath(spaceId), 'tasks', taskId);
    try {
        await file.createDirectory(taskFolderPath);
    } catch (error) {
        if (error.statusCode !== 409) {
            throw error;
        }
    }
}

function getDailyLogFileName() {
    const getTaskFileName = (year, month, day) => `logs-${year}-${month}-${day}.log`;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return getTaskFileName(year, month, day);
}

async function ensureTaskFileExists(spaceId, fileName) {
    const taskFilePath = path.join(getSpacePath(spaceId), 'tasks', fileName);
    try {
        await fsPromises.access(taskFilePath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fsPromises.writeFile(taskFilePath, '');
        } else {
            throw error;
        }
    }
    return taskFilePath;
}


async function getTaskLogFilePath(spaceId) {
    await ensureTasksFolderExists(spaceId);
    const logFileName = getDailyLogFileName();
    await ensureTaskFileExists(spaceId, logFileName);
    return path.join(getSpacePath(spaceId), 'tasks', getDailyLogFileName());
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

async function getDefaultPersonality(spaceId) {
    const spacePath = getSpacePath(spaceId);
    const personalityPath = path.join(spacePath, 'personalities', 'metadata.json');
    const personalitiesData = JSON.parse(await fsPromises.readFile(personalityPath, 'utf8'));
    const defaultPersonalityId = personalitiesData.find(personality => personality.name === spaceConstants.defaultPersonality).id;
    const defaultPersonalityPath = path.join(spacePath, 'personalities', `${defaultPersonalityId}.json`);
    try {
        const defaultPersonalityData = await fsPromises.readFile(defaultPersonalityPath, 'utf8');
        return JSON.parse(defaultPersonalityData);
    } catch (error) {
        error.message = `Default Personality ${spaceConstants.defaultPersonality} not found.`;
        error.statusCode = 404;
        throw error;
    }
}

async function createChat(spaceId, chatId) {


}

async function copyDefaultPersonalities(spacePath, spaceId, defaultSpaceAgentId, spaceModule) {
    const defaultPersonalitiesPath = volumeManager.paths.defaultPersonalities;
    const personalitiesPath = path.join(spacePath, 'personalities');

    await file.createDirectory(personalitiesPath);
    const files = await fsPromises.readdir(defaultPersonalitiesPath, {withFileTypes: true});

    let promises = [];
    const defaultLlmsRes = await fetch(`${process.env.BASE_URL}/apis/v1/llms/defaults`);
    const defaultLlms = (await defaultLlmsRes.json()).data;
    for (const entry of files) {
        if (entry.isFile()) {
            promises.push(preparePersonalityData(defaultPersonalitiesPath, personalitiesPath, entry, spaceId, defaultSpaceAgentId, spaceModule, defaultLlms));
        }
    }
    const personalitiesData = await Promise.all(promises);

    await Promise.all(personalitiesData.map(personalityData => createChat(spaceId, personalityData.id)));
    await fsPromises.writeFile(path.join(spacePath, 'personalities', 'metadata.json'), JSON.stringify(personalitiesData), 'utf8');
}

async function preparePersonalityData(defaultPersonalitiesPath, personalitiesPath, entry, spaceId, defaultSpaceAgentId, spaceModule, defaultLlms) {
    const filePath = path.join(defaultPersonalitiesPath, entry.name);
    let personality = JSON.parse(await fsPromises.readFile(filePath, 'utf8'));
    const constants = require("assistos").constants;
    personality.llms = defaultLlms;
    if (personality.name === constants.DEFAULT_PERSONALITY_NAME) {
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
                    roles: [spaceConstants.spaceRoles.admin, spaceConstants.spaceRoles.owner],
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

    await createDefaultSpaceChats(lightDBEnclaveClient, spaceId);

    return spaceObj;
}

async function getSpaceChat(spaceId, chatId) {
    const lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    const tableName = `chat_${chatId}`
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

async function storeSpaceChat(spaceId, chatId) {
    const chat = await getSpaceChat(spaceId, chatId);
    const personality = await getPersonalityData(spaceId, chatId);
    if (!personality.chats) {
        personality.chats = {}
    }
    const id = crypto.generateId();
    personality.chats[id] = chat;
    await updatePersonalityData(spaceId, chatId, personality);
}

async function resetSpaceChat(spaceId, chatId) {
    const tableName = `chat_${chatId}`
    await lightDB.deleteAllRecords(spaceId, tableName);
}

async function updateSpaceChatDocument(spaceId, chatId, chatItemObj) {
    let documentId = `documents_chat_${chatId}`
    const chatDocumentRecord = await lightDB.getRecord(spaceId, documentId, chatItemObj.id)
    chatDocumentRecord.data.text = chatItemObj.message;
    await lightDB.updateRecord(spaceId, documentId, chatItemObj.id, chatDocumentRecord.data)
}

async function addSpaceChatMessage(spaceId, chatId, entityId, role, messageData) {
    const messageId = crypto.generateId();
    const tableName = `chat_${chatId}`
    const primaryKey = `chat_${chatId}_${entityId}_${messageId}`
    const chatObj = {
        role: role,
        message: messageData,
        user: entityId,
        id: messageId
    }

    await Promise.all([lightDB.insertRecord(spaceId, tableName, primaryKey, chatObj),addSpaceChatDocumentItem(spaceId, chatId, chatObj)])
    return messageId
}

const composeParagraphMessage = function (chatObj) {
    return chatObj.message
}

async function addSpaceChatDocumentItem(spaceId, chatId, chatItemObj) {
    const documentId = `documents_chat_${chatId}`;
    const documentRecord = await lightDB.getContainerObject(spaceId, documentId);

    let messagesChapterId

    let authSecret = await secrets.getApiHubAuthSecret();

    let securityContextConfig = {
        headers: {
            cookie: cookie.createApiHubAuthCookies(authSecret, this.userId, this.spaceId)
        }
    }
    const SecurityContext = require('assistos').ServerSideSecurityContext;
    const securityContext = new SecurityContext(securityContextConfig);
    const documentModule = require('assistos').loadModule('document', securityContext)

    if (documentRecord.chapters.length === 0) {

        const chatChapterData = {
            title: `Chat Messages`,
            paragraphs: []
        }
        await documentModule.addChapter(spaceId, documentId,chatChapterData);
    } else {
        messagesChapterId = documentRecord.chapters[0].id;
    }

    const paragraphObj = {
        text: composeParagraphMessage(chatItemObj),
        commands: {
            replay: {
                role: chatItemObj.role,
                name: chatItemObj.user,
            }
        },
        id: chatItemObj.id,
        comment: JSON.stringify(chatItemObj)
    }
    await documentModule.addParagraph(spaceId, documentId, messagesChapterId, paragraphObj);
}

async function updateSpaceChatMessage(spaceId, chatId, entityId, messageId, message) {
    const tableName = `chat_${chatId}`
    const primaryKey = `chat_${chatId}_${entityId}_${messageId}`
    const record = await lightDB.getRecord(spaceId, tableName, primaryKey);
    if (!record) {
        const error = new Error(`Message with id ${messageId} not found`);
        error.statusCode = 404;
        throw error;
    }
    record.data.message = message;
   await Promise.all([lightDB.updateRecord(spaceId, tableName, primaryKey, record.data), updateSpaceChatDocument(spaceId, chatId, record.data)]);
}

async function createSpaceChat(spaceId, chatId, lightDbClient) {
    lightDbClient = enclave.initialiseLightDBEnclave(spaceId);
    let tableName = `chat_${chatId}`;
    const messageId = crypto.generateId();
    const entryMessagePk = `chat_${chatId}_space_${messageId}`;
    const entryMessage = `This is the workspace chat where you can discuss and collaborate with your team members.`;


    await lightDbClient.insertRecord($$.SYSTEM_IDENTIFIER, tableName, entryMessagePk, {
        data: {
            role: "Space",
            message: entryMessage,
            id: messageId
        }
    });

    const Document = require('../document/services/document.js')
    const Paragraph = require('../document/services/paragraph.js')
    const Chapter = require('../document/services/chapter.js')

    const documentData = {
        title: `chat_${chatId}`,
        topic: '',
        metadata: ["id", "title"],
        id: `documents_chat_${chatId}`
    }
    const chatChapterData = {
        title: `Chat Messages`,
        paragraphs: []
    }
    const chatContextChapterData = {
        title: `Chat Context`,
        paragraphs: []
    }

    const paragraphData = {
        text: `This is the workspace chat where you can discuss and collaborate with your team members.`,
        commands: {}
    }

    const docId = await Document.createDocument(spaceId, documentData);
    const chatItemsChapterId = await Chapter.createChapter(spaceId, docId, chatChapterData)
    const chatContextChapterId = await Chapter.createChapter(spaceId, docId, chatContextChapterData)
    const welcomeParagraphId = await Paragraph.createParagraph(spaceId, docId, chatItemsChapterId.id, paragraphData)
    return docId;
}

async function createDefaultSpaceChats(lightDbClient, spaceId) {
    const spacePersonalities = await getSpacePersonalitiesObject(spaceId);
    await Promise.all(spacePersonalities.map(personalityData => createSpaceChat(spaceId, personalityData.id, lightDbClient)));
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

async function updatePersonalityData(spaceId, personalityId, personalityData) {
    const personalityPath = path.join(getSpacePath(spaceId), 'personalities', `${personalityId}.json`);
    await fsPromises.writeFile(personalityPath, JSON.stringify(personalityData, null, 2), 'utf8');
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
    if (spacesNr === 1) {
        return "You can't delete your last space";
    }
    let spaceStatus = await getSpaceStatusObject(spaceId);
    if (!spaceStatus.admins[userId]) {
        return "You dont have permission to delete this space";
    }
    //unlink space from all users
    for (let userId of Object.keys(spaceStatus.users)) {
        await user.unlinkSpaceFromUser(userId, spaceId);
    }
    //delete space folder
    let spacePath = getSpacePath(spaceId);
    await fsPromises.rm(spacePath, {recursive: true, force: true});
    //delete documents
    let documentsList = await documentService.getDocumentsMetadata(spaceId);
    for (let document of documentsList) {
        await documentService.deleteDocument(spaceId, document.id);
    }
    //delete api keys
    let keys = await secrets.getAPIKeys(spaceId);
    for (let keyType in keys) {
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
        if (!fileName.includes('metadata')) {
            const personalityJson = await fsPromises.readFile(path.join(personalitiesDirectoryPath, fileName), 'utf8');
            spacePersonalitiesObject.push(JSON.parse(personalityJson));
        }
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

async function addApplicationToSpaceObject(spaceId, applicationData, manifest) {
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

async function removeApplicationFromSpaceObject(spaceId, applicationId) {
    const spaceStatusObject = await getSpaceStatusObject(spaceId);
    spaceStatusObject.installedApplications = spaceStatusObject.installedApplications.filter(application => application.name !== applicationId);
    await updateSpaceStatus(spaceId, spaceStatusObject);
}

async function deleteSpaceCollaborator(referrerId, spaceId, userId) {
    const user = require('../users-storage/user.js');
    const spaceStatusObject = await getSpaceStatusObject(spaceId);

    let referrerRoles = spaceStatusObject.users[referrerId].roles;
    if (!referrerRoles.includes(spaceConstants.spaceRoles.owner) && !referrerRoles.includes(spaceConstants.spaceRoles.admin)) {
        return "You don't have permission to delete a collaborator";
    }
    let userRoles = spaceStatusObject.users[userId].roles;
    if (userRoles.includes(spaceConstants.spaceRoles.owner)) {
        let owners = getOwnersCount(spaceStatusObject.users);
        if (owners === 1) {
            return "Can't delete the last owner of the space";
        }
    }
    delete spaceStatusObject.users[userId];
    await updateSpaceStatus(spaceId, spaceStatusObject);
    await user.unlinkSpaceFromUser(userId, spaceId);
}

async function getSpaceCollaborators(spaceId) {
    const user = require('../users-storage/user.js');
    const spaceStatusObject = await getSpaceStatusObject(spaceId);
    let users = [];
    for (let userId in spaceStatusObject.users) {
        const userFile = await user.getUserFile(userId);
        users.push({id: userId, email: userFile.email, role: getPriorityRole(spaceStatusObject.users[userId].roles)});
    }
    return users;
}

function getOwnersCount(users) {
    let owners = 0;
    for (let id in users) {
        if (users[id].roles.includes(spaceConstants.spaceRoles.owner)) {
            owners++;
        }
    }
    return owners;
}

async function setSpaceCollaboratorRole(referrerId, spaceId, userId, role) {
    const spaceStatusObject = await getSpaceStatusObject(spaceId);
    let referrerRoles = spaceStatusObject.users[referrerId].roles;
    if (!referrerRoles.includes(spaceConstants.spaceRoles.owner) && !referrerRoles.includes(spaceConstants.spaceRoles.admin)) {
        return "You don't have permission to change the role of a collaborator";
    }
    let userRoles = spaceStatusObject.users[userId].roles;
    if (userRoles.includes(spaceConstants.spaceRoles.owner)) {
        let owners = getOwnersCount(spaceStatusObject.users);
        if (owners === 1 && role !== spaceConstants.spaceRoles.owner) {
            return "Can't change the role of the last owner of the space";
        }
    }
    spaceStatusObject.users[userId].roles = [role];
    await updateSpaceStatus(spaceId, spaceStatusObject);
}

function getPriorityRole(roles) {
    let rolePriority = [spaceConstants.spaceRoles.owner, spaceConstants.spaceRoles.admin, spaceConstants.spaceRoles.member];
    return rolePriority.find(priorityRole => roles.includes(priorityRole));
}

async function inviteSpaceCollaborators(referrerId, spaceId, collaborators) {
    const user = require('../users-storage/user.js');
    const emailService = require('../email').instance;
    const userMap = await user.getUserMap();
    const spaceStatusObject = await getSpaceStatusObject(spaceId);
    const spaceName = spaceStatusObject.name;
    const existingUserIds = Object.keys(spaceStatusObject.users)
    let existingCollaborators = [];
    for (let collaborator of collaborators) {
        const userId = userMap[collaborator.email];

        if (userId && existingUserIds.includes(userId)) {
            existingCollaborators.push(collaborator.email);
            continue;
        }
        if (userId) {
            await user.addSpaceCollaborator(spaceId, userId, collaborator.role, referrerId);
            await emailService.sendUserAddedToSpaceEmail(collaborator.email, spaceName);
        } else {
            const invitationToken = await user.registerInvite(referrerId, spaceId, collaborator.email);
            await emailService.sendUserAddedToSpaceEmail(collaborator.email, spaceName, invitationToken);
        }
    }
    return existingCollaborators;
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
        readFileAsBuffer,
        getDefaultPersonality,
        getTaskLogFilePath,
        getSpacePersonalitiesObject,
        getSpaceCollaborators,
        setSpaceCollaboratorRole,
        inviteSpaceCollaborators,
        deleteSpaceCollaborator,
        createSpaceChat,
        updateSpaceChatMessage,
        resetSpaceChat,
        storeSpaceChat
    },
    templates: {
        defaultSpaceAnnouncement: require('./templates/defaultSpaceAnnouncement.json'),
        defaultSpaceNameTemplate: require('./templates/defaultSpaceNameTemplate.json'),
        defaultSpaceTemplate: require('./templates/defaultSpaceTemplate.json'),
        spaceValidationSchema: require('./templates/spaceValidationSchema.json')
    },
    constants: require('./constants.js')
}

