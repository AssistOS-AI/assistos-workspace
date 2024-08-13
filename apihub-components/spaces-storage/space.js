const path = require('path');
const fsPromises = require('fs').promises;
const volumeManager = require('../volumeManager.js');
const archiver = require('archiver');
const enclave = require('opendsu').loadAPI('enclave');
const { pipeline } = require('stream');
const util = require('util');
const pipelineAsync = util.promisify(pipeline);
const crypto = require("../apihub-component-utils/crypto");
const data = require('../apihub-component-utils/data.js');
const date = require('../apihub-component-utils/date.js');
const file = require('../apihub-component-utils/file.js');
const openAI = require('../apihub-component-utils/openAI.js');
const secrets = require('../apihub-component-utils/secrets.js');
const utils= require('../apihub-component-utils/utils.js');
const https = require('https');
const fs = require('fs');
const spaceConstants = require('./constants.js');

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
    const tableName = `spaceChat_${spaceId}`
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

async function addSpaceChatMessage(spaceId, chatId, entityId, role, messageData) {
    const lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    const messageId = crypto.generateId();
    const tableName = `spaceChat_${spaceId}`
    const primaryKey = `${entityId}_${date.getCurrentUnixTime()}`
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
        const tableName = "chat_Workspace";
        const entryMessagePk = `${spaceId}_${tableName}_entryMessage`;
        const entryMessage = `Welcome to ${spaceName}! This is the workspace chat where you can discuss and collaborate with your team members.`
        await lightDBEnclaveClient.insertRecord($$.SYSTEM_IDENTIFIER, tableName, entryMessagePk, {
            data: {
                role: "Space",
                message: entryMessage,
            }
        })
    }
    const createDiscussionChat = async () => {
        const tableName = "chat_General";
        const entryMessagePk = `${spaceId}_entryMessage`;
        const entryMessage = `Welcome to the discussion chat! Here you can discuss and share ideas with your team members.`
        await lightDBEnclaveClient.insertRecord($$.SYSTEM_IDENTIFIER, tableName, entryMessagePk, {
            data: {
                role: "Space",
                message: entryMessage,
            }
        })
    }
    await Promise.all([createWorkspaceChat(), createDiscussionChat()])
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

const downloadData = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest);
            reject(err);
        });
    });
};

async function putImage(spaceId, imageId, imageData) {
    const imagesPath = path.join(getSpacePath(spaceId), 'images');
    if (imageData.startsWith("http")) {
        await downloadData(imageData, path.join(imagesPath, `${imageId}.png`));
        return;
    }
    const base64Data = imageData.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    await fsPromises.writeFile(path.join(imagesPath, `${imageId}.png`), buffer);
}

async function getImage(spaceId, imageId) {
    const imagesPath = path.join(getSpacePath(spaceId), 'images');
    const imagePath = path.join(imagesPath, `${imageId}.png`);
    return await fsPromises.readFile(imagePath);
}

function getImageStream(spaceId, imageId) {
    const imagesPath = path.join(getSpacePath(spaceId), 'images');
    const imagePath = path.join(imagesPath, `${imageId}.png`);
    return fs.createReadStream(imagePath);
}

async function deleteImage(spaceId, imageId) {
    const imagesPath = path.join(getSpacePath(spaceId), 'images');
    const imagePath = path.join(imagesPath, `${imageId}.png`);
    await fsPromises.rm(imagePath);
}

async function putAudio(spaceId, audioId, audioData) {
    const audiosPath = path.join(getSpacePath(spaceId), 'audios');
    let buffer;
    if (typeof audioData === 'string') {
        if (audioData.startsWith("data:")) {
            const base64Data = audioData.split(",")[1];
            buffer = Buffer.from(base64Data, 'base64');
            return await fsPromises.writeFile(path.join(audiosPath, `${audioId}.mp3`), buffer);
        } else if (audioData.startsWith("http")) {
            await downloadData(audioData, path.join(audiosPath, `${audioId}.mp3`));
            return;
        } else {
            buffer = Buffer.from(audioData, 'base64');
            return await fsPromises.writeFile(path.join(audiosPath, `${audioId}.mp3`), buffer);
        }
    }
    buffer = Buffer.from(audioData);
    await fsPromises.writeFile(path.join(audiosPath, `${audioId}.mp3`), buffer);
}

async function getAudio(spaceId, audioId) {
    const audiosPath = path.join(getSpacePath(spaceId), 'audios');
    const audioPath = path.join(audiosPath, `${audioId}.mp3`);
    return await fsPromises.readFile(audioPath);
}

function getAudioStream(spaceId, audioId) {
    const audiosPath = path.join(getSpacePath(spaceId), 'audios');
    const audioPath = path.join(audiosPath, `${audioId}.mp3`);
    return fs.createReadStream(audioPath);
}

async function deleteAudio(spaceId, audioId) {
    const audiosPath = path.join(getSpacePath(spaceId), 'audios');
    const audioPath = path.join(audiosPath, `${audioId}.mp3`);
    await fsPromises.rm(audioPath);
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

    const fileStream = fs.createReadStream(videoPath, { start, end });
    const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
    };
    response.writeHead(206, head); // Partial Content
    await pipelineAsync(fileStream, response);

}
async function getVideo(spaceId, videoId) {
    const videosPath = path.join(getSpacePath(spaceId), 'videos');
    const videoPath = path.join(videosPath, `${videoId}.mp4`);
    return await fsPromises.readFile(videoPath);
}

function getVideoStream(spaceId, videoId) {
    const videosPath = path.join(getSpacePath(spaceId), 'videos');
    const videoPath = path.join(videosPath, `${videoId}.mp4`);
    return fs.createReadStream(videoPath);
}

async function deleteVideo(spaceId, videoId) {
    const videosPath = path.join(getSpacePath(spaceId), 'videos');
    const videoPath = path.join(videosPath, `${videoId}.mp4`);
    await fsPromises.rm(videoPath);
}

async function getDocumentData(spaceId, documentId) {
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    const documentRecords = await $$.promisify(lightDBEnclaveClient.getAllRecords)($$.SYSTEM_IDENTIFIER, documentId);

    let documentRecordsContents = {};

    /* access time optimization */
    documentRecords.forEach(record => {
        documentRecordsContents[record.pk] = record.data;
    });

    /* TODO there seems to be a bug where multiple chapters have position 0 - talk with Mircea */
    const documentRecord = documentRecordsContents[documentId];

    let audios = [];
    let images = [];
    let videos = [];

    let documentData = {
        title: documentRecord.title,
        topic: documentRecord.topic,
        metadata: documentRecord.metadata,
        /* TODO documents dont have a saved abstract field - talk with Mircea */
        abstract: documentRecord.abstract || "",
        chapters: documentRecord.chapters.map(chapterId => {
            let chapter = {}
            chapter.title = documentRecordsContents[chapterId].title
            if (documentRecordsContents[chapterId].backgroundSound) {
                chapter.backgroundSound = documentRecordsContents[chapterId].backgroundSound
                audios.push(documentRecordsContents[chapterId].backgroundSound.src)
            }
            chapter.position = documentRecordsContents[chapterId].position
            chapter.id = chapterId
            chapter.paragraphs = documentRecordsContents[chapterId].paragraphs.map(paragraphId => {
                let paragraph = {}
                paragraph.id = paragraphId;
                if (documentRecordsContents[paragraphId].position) {
                    paragraph.position = documentRecordsContents[paragraphId].position
                }
                if (documentRecordsContents[paragraphId].text) {
                    paragraph.text = documentRecordsContents[paragraphId].text;
                }
                if (documentRecordsContents[paragraphId].audio) {
                    paragraph.audio = documentRecordsContents[paragraphId].audio;
                    audios.push(documentRecordsContents[paragraphId].audio.src)
                }
                if (documentRecordsContents[paragraphId].audioConfig) {
                    paragraph.audioConfig = documentRecordsContents[paragraphId].audioConfig;
                }
                if (documentRecordsContents[paragraphId].image) {
                    paragraph.image = documentRecordsContents[paragraphId].image;
                    images.push(documentRecordsContents[paragraphId].image.src)
                    paragraph.dimensions = documentRecordsContents[paragraphId].dimensions;
                }
                return paragraph
            })
            return chapter;
        })
    }
    documentData.images = images;
    documentData.audios = audios;
    documentData.videos = videos;
    return documentData
}

async function archiveDocument(spaceId, documentId) {
    const documentData = await getDocumentData(spaceId, documentId);
    const contentBuffer = Buffer.from(JSON.stringify(documentData), 'utf-8');
    const checksum = require('crypto').createHash('sha256').update(contentBuffer).digest('hex');

    const metadata = {
        title: documentData.title,
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

    documentData.images.forEach(imageData => {
        const imageName = imageData.split("/").pop();
        const imageStream = getImageStream(spaceId, imageName);
        archive.append(imageStream, {name: `images/${imageName}.png`});
    });

    documentData.audios.forEach(audioData => {
        const audioName = audioData.split("/").pop();
        const audioStream = getAudioStream(spaceId, audioName);
        archive.append(audioStream, {name: `audios/${audioName}.mp3`});
    });

    archive.finalize();
    return stream;
}


async function importDocument(spaceId, extractedPath, request) {
    const docMetadataPath = path.join(extractedPath, 'metadata.json');
    const docDataPath = path.join(extractedPath, 'data.json');

    const docMetadataStream = fs.createReadStream(docMetadataPath, 'utf8');
    const docDataStream = fs.createReadStream(docDataPath, 'utf8');

    const docMetadata = await streamToJson(docMetadataStream);
    const docData = await streamToJson(docDataStream);

    async function uploadImage(spaceId, imageData) {
        const result = await fetch(`${process.env.BASE_URL}/spaces/image/${spaceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.cookie,
            },
            body: JSON.stringify(imageData)
        });
        const responseData = await result.json();
        return responseData.data;
    }

    const result = await fetch(`${process.env.BASE_URL}/spaces/containerObject/${spaceId}/documents`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.cookie,
        },
        body: JSON.stringify({
            title: docMetadata.title,
            topic: docMetadata.topic,
            metadata: ["id", "title"]
        })
    });
    const docId = (await result.json()).data;

    for (const chapter of docData.chapters) {
        let objectURI = encodeURIComponent(`${docId}/chapters`);
        let chapterObject = {
            title: chapter.title,
            position: chapter.position || 0
        };

        if (chapter.backgroundSound) {
            chapterObject.backgroundSound = chapter.backgroundSound;
            let audioId = chapter.backgroundSound.id;
            const audioPath = path.join(extractedPath, 'audios', `${audioId}.mp3`);
            const audioBase64Data = await readFileAsBase64(audioPath);
            const result = await fetch(`${process.env.BASE_URL}/spaces/audio/${spaceId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': request.headers.cookie,
                },
                body: JSON.stringify(audioBase64Data)
            });
            audioId = (await result.json()).data;
            chapterObject.backgroundSound.id = audioId;
            chapterObject.backgroundSound.src = `spaces/audio/${spaceId}/${audioId}`;
        }

        const chapterResult = await fetch(`${process.env.BASE_URL}/spaces/embeddedObject/${spaceId}/${objectURI}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.cookie,
            },
            body: JSON.stringify(chapterObject)
        });

        const chapterId = (await chapterResult.json()).data;

        for (const paragraph of chapter.paragraphs) {
            let paragraphObject = {text: paragraph.text || ""};
            objectURI = encodeURIComponent(`${docId}/${chapterId}/paragraphs`);

            if (paragraph.image) {
                const imagePath = path.join(extractedPath, 'images', `${paragraph.image.id}.png`);
                const imageBase64Data = await readFileAsBase64(imagePath);
                const dataUrl = `data:image/png;base64,${imageBase64Data}`;
                const imageId = await uploadImage(spaceId, dataUrl);
                paragraph.image.id = imageId;
                paragraph.image.src = `spaces/image/${spaceId}/${imageId}`;
                paragraph.image.isUploadedImage = true;
                paragraphObject.image = paragraph.image;
                paragraphObject.dimensions = paragraph.dimensions;
            }

            if (paragraph.audio) {
                paragraphObject.audio = paragraph.audio;
                let audioId = paragraph.audio.id;
                const audioPath = path.join(extractedPath, 'audios', `${audioId}.mp3`);
                const audioBase64Data = await readFileAsBase64(audioPath);
                const result = await fetch(`${process.env.BASE_URL}/spaces/audio/${spaceId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': request.headers.cookie,
                    },
                    body: JSON.stringify(audioBase64Data)
                });
                audioId = (await result.json()).data;
                paragraphObject.audio.id = audioId;
                paragraphObject.audio.src = `spaces/audio/${spaceId}/${audioId}`;
            }

            if (paragraph.audioConfig) {
                paragraphObject.audioConfig = paragraph.audioConfig;
            }

            await fetch(`${process.env.BASE_URL}/spaces/embeddedObject/${spaceId}/${objectURI}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': request.headers.cookie,
                },
                body: JSON.stringify(paragraphObject)
            });
        }
    }

    fs.rmSync(extractedPath, {recursive: true, force: true});

}

async function streamToJson(stream) {
    return new Promise((resolve, reject) => {
        let data = '';
        stream.on('data', chunk => data += chunk);
        stream.on('end', () => resolve(JSON.parse(data)));
        stream.on('error', err => reject(err));
    });
}

async function readFileAsBase64(filePath) {
    return new Promise((resolve, reject) => {
        let data = '';
        const stream = fs.createReadStream(filePath, {encoding: 'base64'});
        stream.on('data', chunk => data += chunk);
        stream.on('end', () => resolve(data));
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
    const personalityMetadataPath = path.join(extractedPath, 'metadata.json');
    const personalityDataPath = path.join(extractedPath, 'data.json');

    const personalityMetadataStream = fs.createReadStream(personalityMetadataPath, 'utf8');
    const personalityDataStream = fs.createReadStream(personalityDataPath, 'utf8');

    const personalityMetadata = await streamToJson(personalityMetadataStream);

    const personalityData = await streamToJson(personalityDataStream);
    const spacePersonalities= await getSpacePersonalitiesObject(spaceId);


    const personalityNames = spacePersonalities.map(personality => personality.name);
    personalityData.name= utils.ensureUniqueFileName(personalityNames, personalityData.name);

    const result = await fetch(`${process.env.BASE_URL}/spaces/fileObject/${spaceId}/personalities`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.cookie,
        },
        body: JSON.stringify(personalityData)
    });
    const personalityId = (await result.json()).data;
    return personalityId;

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
        getDocumentData,
        archiveDocument,
        importDocument,
        getAudioStream,
        getVideoStream,
        getImageStream,
        archivePersonality,
        importPersonality,
        getVideoParts
    },
    templates: {
        defaultSpaceAnnouncement: require('./templates/defaultSpaceAnnouncement.json'),
        defaultSpaceNameTemplate: require('./templates/defaultSpaceNameTemplate.json'),
        defaultSpaceTemplate: require('./templates/defaultSpaceTemplate.json'),
        spaceValidationSchema: require('./templates/spaceValidationSchema.json')
    },
    constants: require('./constants.js')
}

