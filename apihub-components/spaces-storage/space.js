const path = require('path');
const fsPromises = require('fs').promises;
const AdmZip = require('adm-zip');

const volumeManager = require('../volumeManager.js');

const enclave = require('opendsu').loadAPI('enclave');

const crypto = require("../apihub-component-utils/crypto");
const data = require('../apihub-component-utils/data.js');
const date = require('../apihub-component-utils/date.js');
const file = require('../apihub-component-utils/file.js');
const openAI = require('../apihub-component-utils/openAI.js');
const secrets = require('../apihub-component-utils/secrets.js');
const https = require('https');
const fs = require('fs');
const spaceConstants = require('./constants.js');
const {exec} = require("child_process");
const ffmpegPath = require("ffmpeg-static");
const {eventPublisher} = require("../subscribers/controller");

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

async function createSpaceChat(spaceId, chatName, chatSettings) {
    const lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    const entryMessagePk = `${spaceId}_${chatName}_entryMessage`;
    const tableName = `chat_${chatName}`;
}

async function creatSpaceUserChat(spaceId, chatName, chatSettings) {
    const tableName = `chat_${userId}_${chatName}`;
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

async function deleteImage(spaceId, imageId) {
    const imagesPath = path.join(getSpacePath(spaceId), 'images');
    const imagePath = path.join(imagesPath, `${imageId}.png`);
    await fsPromises.rm(imagePath);
}

async function putAudio(spaceId, audioId, audioData) {
    const audiosPath = path.join(getSpacePath(spaceId), 'audios');
    if (audioData.startsWith("http")) {
        await downloadData(audioData, path.join(audiosPath, `${audioId}.mp3`));
        return;
    }
    const base64Data = audioData.replace(/^data:audio\/mp3;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    await fsPromises.writeFile(path.join(audiosPath, `${audioId}.mp3`), buffer);
}

async function getAudio(spaceId, audioId) {
    const audiosPath = path.join(getSpacePath(spaceId), 'audios');
    const audioPath = path.join(audiosPath, `${audioId}.mp3`);
    return await fsPromises.readFile(audioPath);
}

async function deleteAudio(spaceId, audioId) {
    const audiosPath = path.join(getSpacePath(spaceId), 'audios');
    const audioPath = path.join(audiosPath, `${audioId}.mp3`);
    await fsPromises.rm(audioPath);
}

async function getVideo(spaceId, videoId) {
    const videosPath = path.join(getSpacePath(spaceId), 'videos');
    const videoPath = path.join(videosPath, `${videoId}.mp4`);
    return await fsPromises.readFile(videoPath);
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

function runFfmpeg(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout || stderr);
        });
    });
}

async function concatenateAudioFiles(tempVideoDir, audioFilesPaths, outputAudioPath) {
    const fileListPath = path.join(tempVideoDir, 'audio_files.txt');
    const fileListContent = audioFilesPaths.map(file => `file '${file}'`).join('\n');
    await fsPromises.writeFile(fileListPath, fileListContent);

    const command = `${ffmpegPath} -f concat -safe 0 -i ${fileListPath} -c copy ${outputAudioPath}`;
    await runFfmpeg(command);

    await fsPromises.unlink(fileListPath);
}


async function createVideoFromImages(images, duration, outputVideoPath) {
    const filterComplex = images.map((image, index) => `[${index}:v]`).join('') + `concat=n=${images.length}:v=1:a=0,format=yuv420p[v]`;
    const inputs = images.map(image => `-loop 1 -t ${duration} -i ${image}`).join(' ');

    const command = `${ffmpegPath} ${inputs} -filter_complex "${filterComplex}" -map "[v]" ${outputVideoPath}`;
    await runFfmpeg(command);
}

async function combineVideoAndAudio(videoPath, audioPath, outputPath) {
    const command = `${ffmpegPath} -i ${videoPath} -i ${audioPath} -c:v copy -c:a aac -strict experimental ${outputPath}`;
    await runFfmpeg(command);
}

async function documentToVideo(spaceId, document, userId, videoId) {
    const spacePath = getSpacePath(spaceId);
    const audiosPath = path.join(spacePath, 'audios');
    const imagesPath = path.join(spacePath, 'images');
    const tempVideoDir = path.join(spacePath, "videos", `${videoId}_temp`);
    await file.createDirectory(tempVideoDir);
    const chapterVideos = [];
    for (let i = 0; i < document.chapters.length; i++) {
        const chapter = document.chapters[i];
        let paragraphsAudioPath = [];
        let chapterImagesPath = [];
        for (let paragraph of chapter.paragraphs) {
            if (paragraph.audio) {
                let audioPath = path.join(audiosPath, `${paragraph.audio.src.split("/").pop()}.mp3`);
                paragraphsAudioPath.push(audioPath);
            } else if (paragraph.image) {
                let imagePath = path.join(imagesPath, `${paragraph.image.src.split("/").pop()}.png`);
                chapterImagesPath.push(imagePath);
            }
        }
        const audioPath = path.join(tempVideoDir, `${document.id}_chapter_${i}_audio.mp3`);
        const videoPath = path.join(tempVideoDir, `${document.id}_chapter_${i}_video.mp4`);
        try {
            await concatenateAudioFiles(tempVideoDir, paragraphsAudioPath, audioPath);
        } catch (e) {
            await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
            throw new Error(`Failed to concatenate audio files for chapter ${i}: ${e}`);
        }
        let audioDuration;
        try {
            audioDuration = (await runFfmpeg(`${ffmpegPath} -i ${audioPath} -hide_banner 2>&1 | grep "Duration"`)).match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
        } catch (e) {
            await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
            throw new Error(`Failed to get audio duration for chapter ${i}: ${e}`);
        }
        const totalDuration = parseInt(audioDuration[1]) * 3600 + parseInt(audioDuration[2]) * 60 + parseFloat(audioDuration[3]);
        const imageDuration = totalDuration / chapterImagesPath.length;
        let combinedPath;
        try {
            await createVideoFromImages(chapterImagesPath, imageDuration, videoPath);
            combinedPath = path.join(tempVideoDir, `chapter_${i}_combined.mp4`);
            await combineVideoAndAudio(videoPath, audioPath, combinedPath);
        } catch (e) {
            await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
            throw new Error(`Failed to create video from images for chapter ${i}: ${e}`);
        }

        chapterVideos.push(combinedPath);
    }

    const fileListPath = path.join(tempVideoDir, 'chapter_videos.txt');
    try {
        const fileListContent = chapterVideos.map(file => `file '${file}'`).join('\n');
        await fsPromises.writeFile(fileListPath, fileListContent);
        let outputVideoPath = path.join(getSpacePath(spaceId), 'videos', `${videoId}.mp4`);
        const command = `${ffmpegPath} -f concat -safe 0 -i ${fileListPath} -c copy ${outputVideoPath}`;
        await runFfmpeg(command);
        await fsPromises.unlink(fileListPath);
        await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
    } catch (e) {
        await fsPromises.rm(tempVideoDir, {recursive: true, force: true});
        throw new Error(`Failed to concatenate chapter videos: ${e}`);
    }
    eventPublisher.notifyClientTask(userId, videoId);
}

async function archiveDocument(spaceId, documentId) {
    const documentData = await getDocumentData(spaceId, documentId);

    const zip = new AdmZip();

    const contentBuffer = Buffer.from(JSON.stringify(documentData), 'utf-8');
    const checksum = require('crypto')
        .createHash('sha256')
        .update(contentBuffer)
        .digest('hex');

    const metadata = {
        title: documentData.title,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        version: "1.0",
        checksum: checksum,
        contentFile: "data.json",
    };

    for (let imageData of documentData.images) {
        let image = await getImage(spaceId, imageData.split("/").pop());
        zip.addFile(`images/${imageData.split("/").pop()}.png`, image);
    }

    for (let audioData of documentData.audios) {
        let audio = await getAudio(spaceId, audioData.split("/").pop());
        zip.addFile(`audios/${audioData.split("/").pop()}.mp3`, audio);
    }

    zip.addFile("metadata.json", Buffer.from(JSON.stringify(metadata), 'utf-8'));
    zip.addFile("data.json", contentBuffer);

    return zip.toBuffer();
}

async function importDocument(request, spaceId, fileId, filePath) {
    const zip = new AdmZip(filePath);
    const extractedPath = path.join(__dirname, '../../data-volume/Temp/extracted', fileId);

    zip.extractAllTo(extractedPath, true);
    fs.unlinkSync(filePath);


    const docMetadata = fs.readFileSync(path.join(extractedPath, 'metadata.json'), 'utf8');
    const docMetadataObj = JSON.parse(docMetadata);

    const docDataObj = JSON.parse(fs.readFileSync(path.join(extractedPath, 'data.json'), 'utf8'));

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
        const imageId = responseData.data;
        return imageId;
    }

    const result = await fetch(`${process.env.BASE_URL}/spaces/containerObject/${spaceId}/documents`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.cookie,
        },
        body: JSON.stringify({
            title: docMetadataObj.title,
            topic: docMetadataObj.topic,
            metadata: ["id", "title"]
        })
    });
    const docId = (await result.json()).data;

    for (const chapter of docDataObj.chapters) {
        let objectURI = encodeURIComponent(`${docId}/chapters`);
        let chapterObject = {}

        if (chapter.backgroundSound) {
            chapterObject.backgroundSound = chapter.backgroundSound;
            let audioId = chapter.backgroundSound.id;
            const audioPath = path.join(extractedPath, 'audios', `${audioId}.mp3`);
            const audioBase64Data = fs.readFileSync(audioPath, 'base64');
            const result = await fetch(`${process.env.BASE_URL}/spaces/audio/${spaceId}`,
                {
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
        chapterObject.title = chapter.title;
        chapterObject.position = chapter.position || 0
        const result = await fetch(`${process.env.BASE_URL}/spaces/embeddedObject/${spaceId}/${objectURI}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.cookie,
            },
            body: JSON.stringify(
                chapterObject
            )
        });

        const chapterId = (await result.json()).data;

        for (const paragraph of chapter.paragraphs) {
            let objectURI = encodeURIComponent(`${docId}/${chapterId}/paragraphs`);

            if (paragraph.image) {
                let image = fs.readFileSync(path.join(extractedPath, 'images', `${paragraph.image.id}.png`), 'base64');
                const dataUrl = `data:image/png;base64,${image}`;
                const imageId = await uploadImage(spaceId, dataUrl);
                paragraph.image.id = imageId;
                paragraph.image.src = `spaces/image/${spaceId}/${imageId}`;
                paragraph.image.isUploadedImage = true;
            }
            let paragraphObject = {}
            paragraphObject.text = paragraph.text || "";

            if (paragraph.audio) {
                paragraphObject.audio = paragraph.audio;
                let audioId = paragraph.audio.id;
                const audioPath = path.join(extractedPath, 'audios', `${audioId}.mp3`);
                const audioBase64Data = fs.readFileSync(audioPath, 'base64');
                const result = await fetch(`${process.env.BASE_URL}/spaces/audio/${spaceId}`,
                    {
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
            if (paragraph.image) {
                paragraphObject.image = paragraph.image;
                paragraphObject.dimensions = paragraph.dimensions;
            }
            const result = await fetch(`${process.env.BASE_URL}/spaces/embeddedObject/${spaceId}/${objectURI}`, {
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
        documentToVideo,
        getDocumentData,
        archiveDocument,
        importDocument
    },
    templates: {
        defaultSpaceAnnouncement: require('./templates/defaultSpaceAnnouncement.json'),
        defaultSpaceNameTemplate: require('./templates/defaultSpaceNameTemplate.json'),
        defaultSpaceTemplate: require('./templates/defaultSpaceTemplate.json'),
        spaceValidationSchema: require('./templates/spaceValidationSchema.json')
    },
    constants: require('./constants.js')
}

