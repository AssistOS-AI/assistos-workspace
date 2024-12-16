const space = require("../../spaces-storage/space");
const utils = require("../../apihub-component-utils/utils");
const crypto = require("../../apihub-component-utils/crypto");
const path = require("path");
const fs = require("fs");
const Busboy = require("busboy");
const unzipper = require("unzipper");
const SubscriptionManager = require("../../subscribers/SubscriptionManager");
const ffmpeg = require("../../apihub-component-utils/ffmpeg");
const {sendResponse} = require("../../apihub-component-utils/utils");
const Storage = require("../../apihub-component-utils/storage");
const documentService = require("../services/document");
const ExportDocument = require("../../tasks/ExportDocument");
const TaskManager = require("../../tasks/TaskManager");
const fsPromises = fs.promises;
async function getDocument(req, res) {
    const {spaceId, documentId} = req.params;
    if (!spaceId || !documentId) {
        return utils.sendResponse(res, 400, "application/json", {
            message: "Invalid request" + `Missing ${!spaceId ? "spaceId" : ""} ${!documentId ? "documentId" : ""}`
        });
    }
    try {
        const document = await documentService.getDocument(spaceId, documentId,req.query);
        utils.sendResponse(res, 200, "application/json", {
            data: document
        });
    } catch (error) {
        utils.sendResponse(res, error.statusCode || 500, "application/json", {
            message: `Failed to retrieve document ${documentId}` + error.message
        });
    }

}
async function getDocumentsMetadata(req,res){
    const {spaceId} = req.params;
    if(!spaceId){
        return utils.sendResponse(res, 400, "application/json", {
            message: "Invalid request" + `Missing ${!spaceId ? "spaceId" : ""}`
        });
    }
    try{
        const metadata = await documentService.getDocumentsMetadata(spaceId);
        utils.sendResponse(res, 200, "application/json", {
            data: metadata
        });
    }catch(error){
        utils.sendResponse(res, error.statusCode || 500, "application/json", {
            message: `Failed to retrieve document metadata` + error.message
        });
    }
}

async function createDocument(req, res) {
    const {spaceId} = req.params;
    const documentData = req.body;
    if (!spaceId || !documentData) {
        return utils.sendResponse(res, 400, "application/json", {
            message: "Invalid request" + `Missing ${!spaceId ? "spaceId" : ""} ${!documentData ? "documentData" : ""}`
        });
    }
    try {
        const documentId = await documentService.createDocument(spaceId, documentData);
        SubscriptionManager.notifyClients(req.sessionId, SubscriptionManager.getObjectId(spaceId, "documents"));
        utils.sendResponse(res, 200, "application/json", {
            data: documentId
        });
    } catch (error) {
        utils.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to create document" + error.message
        });
    }
}

async function updateDocument(req, res) {
    const {spaceId, documentId} = req.params;
    const documentData = req.body;
    if (!spaceId || !documentId || !documentData) {
        return utils.sendResponse(res, 400, "application/json", {
            message: "Invalid request" + `Missing ${!spaceId ? "spaceId" : ""} ${!documentId ? "documentId" : ""} ${!documentData ? "request body" : ""}`
        });
    }
    try {
        const updatedFields = req.query.fields;
        /* TODO remove this jk and make something generic for all notifications */
        await documentService.updateDocument(spaceId, documentId, documentData,req.query);
        SubscriptionManager.notifyClients(req.sessionId, SubscriptionManager.getObjectId(spaceId, "documents"));
       if (updatedFields) {
           if (Array.isArray(updatedFields)) {
               updatedFields.forEach(field => {
                     SubscriptionManager.notifyClients(req.sessionId, SubscriptionManager.getObjectId(spaceId, documentId), field);
               })
           }else{
               SubscriptionManager.notifyClients(req.sessionId, SubscriptionManager.getObjectId(spaceId, documentId), updatedFields);
           }
        }
        utils.sendResponse(res, 200, "application/json", {
            message: `Document ${documentId} updated successfully`
        });
    } catch (error) {
        utils.sendResponse(res, error.statusCode || 500, "application/json", {
            message: `Failed to update document ${documentId}` + error.message
        });
    }
}

async function deleteDocument(req, res) {
    const {spaceId, documentId} = req.params;
    if (!spaceId || !documentId) {
        return utils.sendResponse(res, 400, "application/json", {
            message: "Invalid request" + `Missing ${!spaceId ? "spaceId" : ""} ${!documentId ? "documentId" : ""}`
        });
    }
    try {
        await documentService.deleteDocument(spaceId, documentId);
        SubscriptionManager.notifyClients(req.sessionId, SubscriptionManager.getObjectId(spaceId, documentId), "delete");
        SubscriptionManager.notifyClients(req.sessionId, SubscriptionManager.getObjectId(spaceId, "documents"));
        utils.sendResponse(res, 200, "application/json", {
            message: `Document ${documentId} deleted successfully`
        });
    } catch (error) {
        utils.sendResponse(res, error.statusCode || 500, "application/json", {
            message: `Failed to delete document ${documentId}` + error.message
        });
    }

}

async function exportDocument(request, response) {
    const spaceId = request.params.spaceId;
    const documentId = request.params.documentId;
    const exportType = request.body.exportType;
    const userId = request.userId;
    const sessionId = request.sessionId;
    try {
        let task = new ExportDocument(spaceId, userId, {documentId, exportType});
        await TaskManager.addTask(task);
        let objectId = SubscriptionManager.getObjectId(spaceId, "tasks");
        SubscriptionManager.notifyClients(sessionId, objectId);
        sendResponse(response, 200, "application/json", {
            data: task.id
        });
        TaskManager.runTask(task.id);
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Error at getting document: ${documentId}. ${error.message}`
        });
    }
}
function downloadDocumentArchive(request, response) {
    let spaceId = request.params.spaceId;
    let fileName = request.params.fileName;
    let spacePath = space.APIs.getSpacePath(spaceId);
    let filePath = path.join(spacePath, "temp", `${fileName}.docai`);
    streamFile(filePath, response, "application/zip");
}
function streamFile(filePath, response, contentType) {
    try {
        let readStream = fs.createReadStream(filePath);
        let fileSize = fs.statSync(filePath).size;
        response.setHeader('Content-Length', fileSize);
        response.setHeader('Content-Type', contentType);
        response.setHeader('Content-Disposition', `attachment; filename=${path.basename(filePath)}+${path.extname(filePath)}`);
        readStream.on('error', (error) => {
            utils.sendResponse(response, 500, "application/json", {
                message: `Error reading file: ${error.message}`
            });
        });
        readStream.on('end', async () => {
            await fsPromises.unlink(filePath);
        });

        readStream.pipe(response);
    } catch (e) {
        utils.sendResponse(response, 500, "application/json", {
            message: `Error reading file: ${e.message}`
        });
    }
}
function downloadDocumentVideo(request, response) {
    let spaceId = request.params.spaceId;
    let fileName = request.params.fileName;
    let spacePath = space.APIs.getSpacePath(spaceId);
    let filePath = path.join(spacePath, "temp", `${fileName}.mp4`);
    streamFile(filePath, response, "video/mp4");
}

async function importDocument(request, response) {
    const spaceId = request.params.spaceId;
    const fileId = crypto.generateSecret(64);
    const tempDir = path.join(__dirname, '../../../data-volume/Temp', fileId);
    const filePath = path.join(tempDir, `${fileId}.docai`);

    await fs.promises.mkdir(tempDir, {recursive: true});
    const busboy = Busboy({headers: request.headers});
    const taskId = crypto.generateId(16);
    let objectId = SubscriptionManager.getObjectId(spaceId, taskId);
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        const writeStream = fs.createWriteStream(filePath);
        file.pipe(writeStream);
        writeStream.on('close', async () => {
            try {
                await fs.promises.access(filePath, fs.constants.F_OK);

                const extractedPath = path.join(tempDir, 'extracted');
                await fs.promises.mkdir(extractedPath, {recursive: true});

                // Wrap the unzipping process in a Promise
                await new Promise((resolve, reject) => {
                    fs.createReadStream(filePath)
                        .pipe(unzipper.Extract({path: extractedPath}))
                        .on('close', resolve)
                        .on('error', reject);
                });

                await new Promise(resolve => setTimeout(resolve, 0));

                const extractedFiles = await fs.promises.readdir(extractedPath);

                if (!extractedFiles.includes('metadata.json') || !extractedFiles.includes('data.json')) {
                    throw new Error(`Required files not found. Files in directory: ${extractedFiles.join(', ')}`);
                }

                const importResults = await storeDocument(spaceId, extractedPath, request);
                await fs.promises.unlink(filePath);
                SubscriptionManager.notifyClients("", objectId, importResults)
            } catch (error) {
                console.error('Error processing extracted files:', error);
                SubscriptionManager.notifyClients("", objectId, {error: error.message});
            } finally {
                await fs.promises.rm(tempDir, {recursive: true, force: true});
            }
        });

        writeStream.on('error', async (error) => {
            console.error('Error writing file:', error);
            SubscriptionManager.notifyClients("", objectId, {error: error.message});
        });
    });

    busboy.on('error', async (error) => {
        console.error('Busboy error:', error);
        SubscriptionManager.notifyClients("", objectId, {error: error.message});
    });

    request.pipe(busboy);
    utils.sendResponse(response, 200, "application/json", {
        message: 'Document import started',
        data: taskId
    });
}

async function storeDocument(spaceId, extractedPath, request) {
    const SecurityContext = require("assistos").ServerSideSecurityContext;
    let securityContext = new SecurityContext(request);
    const documentModule = require('assistos').loadModule('document', securityContext);
    const spaceModule = require('assistos').loadModule('space', securityContext);
    const docMetadataPath = path.join(extractedPath, 'metadata.json');
    const docDataPath = path.join(extractedPath, 'data.json');

    const docMetadataStream = fs.createReadStream(docMetadataPath, 'utf8');
    const docDataStream = fs.createReadStream(docDataPath, 'utf8');

    const docMetadata = await space.APIs.streamToJson(docMetadataStream);
    const docData = await space.APIs.streamToJson(docDataStream);
    let exportType = docData.exportType;
    const docId = await documentModule.addDocument(spaceId, {
        title: docMetadata.title,
        topic: docMetadata.topic,
        metadata: ["id", "title"]
    });
    const personalities = docData.personalities || [];
    const personalityPath = path.join(extractedPath, 'personalities');
    const overriddenPersonalities = new Set();
    for (let personality of personalities) {
        const personalityFileName = `${personality}.persai`;
        const filePath = path.join(personalityPath, personalityFileName);
        const extractedPath = path.join(personalityPath, 'extracted', personality);
        fs.mkdirSync(extractedPath, {recursive: true});

        await fs.createReadStream(filePath)
            .pipe(unzipper.Extract({path: extractedPath}))
            .promise();

        const importResults = await space.APIs.importPersonality(spaceId, extractedPath, request);
        if (importResults.overriden) {
            overriddenPersonalities.add(importResults.name);
        }
    }
    //for some reason the chapters are in reverse order
    for (let i = docData.chapters.length - 1; i >= 0; i--) {
        const chapter = docData.chapters[i];
        let chapterObject = {
            title: chapter.title,
            position: chapter.position || 0,
            backgroundSound: chapter.backgroundSound
        };

        if (exportType === 'full' && chapter.backgroundSound) {
            chapterObject.backgroundSound = chapter.backgroundSound;
            const audioPath = path.join(extractedPath, 'audios', `${chapter.backgroundSound.fileName}.mp3`);
            const stream = await fs.createReadStream(audioPath);
            chapterObject.backgroundSound.id = crypto.generateId();
            await Storage.putFile( Storage.fileTypes.audios, chapterObject.backgroundSound.id, stream);
            delete chapterObject.backgroundSound.fileName;
        }

        const chapterId = await documentModule.addChapter(spaceId, docId, chapterObject);
        //convertParagraphs(chapter);

        for (let paragraph of chapter.paragraphs) {
            if (exportType === 'full') {
                await storeAttachments(extractedPath, spaceModule, paragraph, spaceId);
            }
            paragraph.id = await documentModule.addParagraph(spaceId, docId, chapterId, paragraph);
            if (paragraph.commands.speech) {
                if (paragraph.commands.speech.taskId) {
                    paragraph.commands.speech.taskId = await documentModule.createTextToSpeechTask(spaceId, docId, paragraph.id);
                    await documentModule.updateParagraphCommands(spaceId, docId, paragraph.id, paragraph.commands);
                }
            }
            if (paragraph.commands.lipsync) {
                if (paragraph.commands.lipsync.taskId) {
                    paragraph.commands.lipsync.taskId = await documentModule.createLipSyncTask(spaceId, docId, paragraph.id);
                    await documentModule.updateParagraphCommands(spaceId, docId, paragraph.id, paragraph.commands);
                }
            }
        }
    }

    fs.rmSync(extractedPath, {recursive: true, force: true});
    return {id: docId, overriddenPersonalities: Array.from(overriddenPersonalities)};
}

async function storeAttachments(extractedPath, spaceModule, paragraph, spaceId) {
    if (paragraph.commands.image) {
        const imagePath = path.join(extractedPath, 'images', `${paragraph.commands.image.fileName}.png`);
        const readStream = fs.createReadStream(imagePath);
        paragraph.commands.image.id = crypto.generateId();
        await Storage.putFile(Storage.fileTypes.images, paragraph.commands.image.id, readStream);
        delete paragraph.commands.image.fileName;
    }
    if (paragraph.commands.audio) {
        const audioPath = path.join(extractedPath, 'audios', `${paragraph.commands.audio.fileName}.mp3`);
        const readStream = fs.createReadStream(audioPath);
        paragraph.commands.audio.id = crypto.generateId();
        await Storage.putFile(Storage.fileTypes.audios, paragraph.commands.audio.id, readStream);
        delete paragraph.commands.audio.fileName;
    }
    if(paragraph.commands.effects){
        for(let effect of paragraph.commands.effects){
            const audioPath = path.join(extractedPath, 'audios', `${effect.fileName}.mp3`);
            const readStream = fs.createReadStream(audioPath);
            effect.id = crypto.generateId();
            await Storage.putFile(Storage.fileTypes.audios, effect.id, readStream);
            delete effect.fileName;
        }
    }
    if (paragraph.commands.video) {
        const videoPath = path.join(extractedPath, 'videos', `${paragraph.commands.video.fileName}.mp4`);
        const readStream = fs.createReadStream(videoPath);
        paragraph.commands.video.id = crypto.generateId();
        await Storage.putFile(Storage.fileTypes.videos, paragraph.commands.video.id, readStream);
        delete paragraph.commands.video.fileName;

        if(paragraph.commands.video.thumbnailId){
            const thumbnailPath = path.join(extractedPath, 'images', `${paragraph.commands.video.thumbnailFileName}.png`);
            const readStream = fs.createReadStream(thumbnailPath);
            paragraph.commands.video.thumbnailId = crypto.generateId();
            await Storage.putFile(Storage.fileTypes.images, paragraph.commands.video.thumbnailId, readStream);
            delete paragraph.commands.video.thumbnailFileName;
        }
    }
}

async function estimateDocumentVideoLength(request, response) {
    let documentId = request.params.documentId;
    let spaceId = request.params.spaceId;
    const SecurityContext = require("assistos").ServerSideSecurityContext;
    let securityContext = new SecurityContext(request);
    const documentModule = require("assistos").loadModule("document", securityContext);
    let document = await documentModule.getDocument(spaceId, documentId);
    try {
        let duration = await ffmpeg.estimateDocumentVideoLength(spaceId, document);
        sendResponse(response, 200, "application/json", {
            message: `Estimation in progress`,
            data: duration
        });
    } catch (e) {
        sendResponse(response, 500, "application/json", {
            message: e.message
        });
    }
}

let selectedDocumentItems = {};
function getSelectedDocumentItems(req, res) {
    try {
        let spaceId = req.params.spaceId;
        let documentId = req.params.documentId;
        let otherUsersSelected = {};
        let userId = req.userId;
        for (let [key, value] of Object.entries(selectedDocumentItems)) {
            if(key.startsWith(`${spaceId}/${documentId}`)){
                if(value.users.find((selection) => selection.userId === userId)){
                    continue;
                }
                let itemId = key.split("/")[2];
                otherUsersSelected[itemId] = {
                    lockOwner: value.lockOwner,
                    users: JSON.parse(JSON.stringify(value.users.map(({ timeoutId, ...user }) => user)))
                };
            }
        }

        return utils.sendResponse(res, 200, "application/json", {
            data: otherUsersSelected
        });
    } catch (e) {
        return utils.sendResponse(res, 500, "application/json", {
            message: e.message
        });
    }
}
function getItemSelectId(spaceId, documentId, itemId){
    return `${spaceId}/${documentId}/${itemId}`;
}
function setNewSelection(sessionId, selectId, spaceId, documentId, itemId, userId, userImageId, lockItem) {
    const paragraphSelectId = getItemSelectId(spaceId, documentId, itemId);
    const timeoutId = setTimeout(() => {
        deleteSelection(paragraphSelectId, selectId, sessionId, documentId, itemId);
    }, 6000 * 10);

    let paragraph = selectedDocumentItems[paragraphSelectId];
    let lockOwner;

    if (!paragraph) {
        // If item doesn't exist, create a new entry with the initial user
        lockOwner = lockItem ? selectId : undefined;
        selectedDocumentItems[paragraphSelectId] = {
            lockOwner,
            users: [{
                selectId,
                timeoutId,
                userId,
                userImageId
            }]
        };
    } else {
        // If item exists, check if user selection already exists
        const existingSelection = paragraph.users.find(selection => selection.selectId === selectId);

        if (existingSelection) {
            // Update existing user's timeout
            clearTimeout(existingSelection.timeoutId);
            existingSelection.timeoutId = timeoutId;
        } else {
            // Add new user to paragraph's user list
            paragraph.users.push({
                selectId,
                timeoutId,
                userId,
                userImageId
            });
        }

        // Determine lock owner
        if (!paragraph.lockOwner && lockItem) {
            lockOwner = selectId;
            paragraph.lockOwner = lockOwner;
        } else {
            lockOwner = paragraph.lockOwner;
        }
    }

    return lockOwner;
}
function deselectDocumentItem(req, res) {
    try {
        let itemId = req.params.itemId;
        let documentId = req.params.documentId;
        let selectId = req.params.selectId;
        let spaceId = req.params.spaceId;
        let paragraphSelectionId = getItemSelectId(spaceId, documentId, itemId);
        deleteSelection(paragraphSelectionId, selectId, req.sessionId, documentId, itemId);
        return utils.sendResponse(res, 200, "application/json", {
        });
    } catch (e) {
        return utils.sendResponse(res, 500, "application/json", {
            message: e.message
        });
    }
}
function selectDocumentItem(req, res) {
    try {
        let itemId = req.params.itemId;
        let documentId = req.params.documentId;
        let userId = req.userId;
        let lockItem = req.body.lockItem;
        let selectId = req.body.selectId;
        let spaceId = req.params.spaceId;

        let lockOwner = setNewSelection(req.sessionId, selectId, spaceId, documentId, itemId, userId, "", lockItem);
        let objectId = SubscriptionManager.getObjectId(documentId, itemId);

        let eventData = {
            selected: true,
            userId: userId,
            selectId: selectId,
            userImageId: "",
            lockOwner: lockOwner
        }
        SubscriptionManager.notifyClients(req.sessionId, objectId, eventData);
        return utils.sendResponse(res, 200, "application/json", {});
    } catch (e) {
        return utils.sendResponse(res, 500, "application/json", {
            message: e.message
        });
    }

}
function deleteSelection(itemSelectId, selectId, sessionId, documentId, itemId){
    let item = selectedDocumentItems[itemSelectId];
    if(!item){
        return;
    }
    let userSelection = item.users.find((selection) => selection.selectId === selectId);
    if(!userSelection){
        return;
    }
    let index = item.users.indexOf(userSelection);
    item.users.splice(index, 1);
    let objectId = SubscriptionManager.getObjectId(documentId, itemId);
    if(userSelection.selectId === item.lockOwner){
        item.lockOwner = undefined;
    }
    let eventData = {
        selected: false,
        selectId: selectId,
        lockOwner: item.lockOwner
    }
    SubscriptionManager.notifyClients(sessionId, objectId, eventData);
    if(item.users.length === 0){
        delete selectedDocumentItems[item];
    }
}
module.exports = {
    getDocument,
    getDocumentsMetadata,
    createDocument,
    updateDocument,
    deleteDocument,
    exportDocument,
    importDocument,
    estimateDocumentVideoLength,
    selectDocumentItem,
    deselectDocumentItem,
    getSelectedDocumentItems,
    downloadDocumentArchive,
    downloadDocumentVideo
}
