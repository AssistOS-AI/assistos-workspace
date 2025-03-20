const space = require("../../space/space");
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
const {Document, Packer, Paragraph, TextRun} = require("docx");
const lightDB = require("../../apihub-component-utils/lightDB");

async function getDocument(req, res) {
    const {spaceId, documentId} = req.params;
    if (!spaceId || !documentId) {
        return utils.sendResponse(res, 400, "application/json", {
            message: "Invalid request" + `Missing ${!spaceId ? "spaceId" : ""} ${!documentId ? "documentId" : ""}`
        });
    }
    try {
        const document = await documentService.getDocument(spaceId, documentId, req.query);
        utils.sendResponse(res, 200, "application/json", document);
    } catch (error) {
        utils.sendResponse(res, error.statusCode || 500, "application/json", {
            message: `Failed to retrieve document ${documentId}` + error.message || ""
        });
    }

}

async function getDocumentsMetadata(req, res) {
    const {spaceId} = req.params;
    if (!spaceId) {
        return utils.sendResponse(res, 400, "application/json", {
            message: "Invalid request" + `Missing ${!spaceId ? "spaceId" : ""}`
        });
    }
    try {
        const metadata = await documentService.getDocumentsMetadata(spaceId);
        utils.sendResponse(res, 200, "application/json", metadata);
    } catch (error) {
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
        utils.sendResponse(res, 200, "text/plain", documentId);
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
        await documentService.updateDocument(spaceId, documentId, documentData, req.query);
        SubscriptionManager.notifyClients(req.sessionId, SubscriptionManager.getObjectId(spaceId, "documents"));
        if (updatedFields) {
            if (Array.isArray(updatedFields)) {
                updatedFields.forEach(field => {
                    SubscriptionManager.notifyClients(req.sessionId, SubscriptionManager.getObjectId(spaceId, documentId), field);
                })
            } else {
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
        sendResponse(response, 200, "text/plain", task.id);
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
        response.setHeader('Content-Disposition', `attachment; filename=${path.basename(filePath)}`);
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

                const docDataPath = path.join(extractedPath, 'data.json');
                const docDataStream = fs.createReadStream(docDataPath, 'utf8');

                const docData = await space.APIs.streamToJson(docDataStream);
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
                const documentId = await storeDocument(spaceId, docData, request, extractedPath);
                await fs.promises.unlink(filePath);
                SubscriptionManager.notifyClients("", objectId, {id:documentId, overriddenPersonalities: Array.from(overriddenPersonalities)});
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
    utils.sendResponse(response, 200, "text/plain", taskId);
}

async function storeDocument(spaceId, docData, request, extractedPath) {
    const SecurityContext = require("assistos").ServerSideSecurityContext;
    let securityContext = new SecurityContext(request);
    const documentModule = require('assistos').loadModule('document', securityContext);
    const spaceModule = require('assistos').loadModule('space', securityContext);

    let exportType = docData.exportType;
    const docId = await documentModule.addDocument(spaceId, {
        title: docData.title,
        topic: docData.topic,
        metadata: ["id", "title", "type"],
        type: docData.type || "document",
        abstract: docData.abstract,
    });
    //for some reason the chapters are in reverse order
    for (let i = docData.chapters.length - 1; i >= 0; i--) {
        const chapter = docData.chapters[i];
        let chapterObject = {
            title: chapter.title,
            position: chapter.position || 0,
            backgroundSound: chapter.backgroundSound,
            commands: chapter.commands || {}
        };

        if (exportType === 'full' && chapter.backgroundSound) {
            chapterObject.backgroundSound = chapter.backgroundSound;
            const audioPath = path.join(extractedPath, 'audios', `${chapter.backgroundSound.fileName}.mp3`);
            const stream = await fs.createReadStream(audioPath);
            chapterObject.backgroundSound.id = crypto.generateId();
            await Storage.putFile(Storage.fileTypes.audios, chapterObject.backgroundSound.id, stream);
            delete chapterObject.backgroundSound.fileName;
        }

        const chapterId = await documentModule.addChapter(spaceId, docId, chapterObject);

        for (let paragraph of chapter.paragraphs) {
            if (exportType === 'full') {
                await storeAttachments(extractedPath, spaceModule, paragraph, spaceId);
            }
            delete paragraph.id;
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
    if(extractedPath){
        fs.rmSync(extractedPath, {recursive: true, force: true});
    }
    return docId;
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
    if (paragraph.commands.effects) {
        for (let effect of paragraph.commands.effects) {
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

        if (paragraph.commands.video.thumbnailId) {
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
        sendResponse(response, 200, "text/plain", duration);
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
            if (key.startsWith(`${spaceId}/${documentId}`)) {
                if (value.users.find((selection) => selection.userId === userId)) {
                    continue;
                }
                let itemId = key.split("/")[2];
                otherUsersSelected[itemId] = {
                    lockOwner: value.lockOwner,
                    users: JSON.parse(JSON.stringify(value.users.map(({timeoutId, ...user}) => user)))
                };
            }
        }

        return utils.sendResponse(res, 200, "application/json", otherUsersSelected);
    } catch (e) {
        return utils.sendResponse(res, 500, "application/json", {
            message: e.message
        });
    }
}

function getItemSelectId(spaceId, documentId, itemId) {
    return `${spaceId}/${documentId}/${itemId}`;
}

function setNewSelection(sessionId, spaceId, documentId, lockData) {
    const paragraphSelectId = getItemSelectId(spaceId, documentId, lockData.itemId);
    const timeoutId = setTimeout(() => {
        deleteSelection(paragraphSelectId, lockData.selectId, sessionId, documentId, lockData.itemId);
    }, 6000 * 10);

    let paragraph = selectedDocumentItems[paragraphSelectId];
    let lockOwner;

    if (!paragraph) {
        // If item doesn't exist, create a new entry with the initial user
        lockOwner = lockData.lockItem ? lockData.selectId : undefined;
        selectedDocumentItems[paragraphSelectId] = {
            lockOwner,
            users: [{
                selectId: lockData.selectId,
                timeoutId,
                userId: lockData.userId,
                userImageId : lockData.userImageId,
                userEmail: lockData.userEmail
            }]
        };
    } else {
        // If item exists, check if user selection already exists
        const existingSelection = paragraph.users.find(selection => selection.selectId === lockData.selectId);

        if (existingSelection) {
            // Update existing user's timeout
            clearTimeout(existingSelection.timeoutId);
            existingSelection.timeoutId = timeoutId;
        } else {
            // Add new user to paragraph's user list
            paragraph.users.push({
                selectId: lockData.selectId,
                timeoutId,
                userId: lockData.userId,
                userImageId: lockData.userImageId,
                userEmail: lockData.userEmail
            });
        }

        // Determine lock owner
        if (!paragraph.lockOwner && lockData.lockItem) {
            lockOwner = lockData.selectId;
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
        return utils.sendResponse(res, 200, "application/json", {});
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
        let { lockItem, selectId, userImageId, userEmail } = req.body;
        let spaceId = req.params.spaceId;
        let lockData = {selectId, itemId, lockItem, userImageId, userId, userEmail};
        let lockOwner = setNewSelection(req.sessionId, spaceId, documentId, lockData);
        let objectId = SubscriptionManager.getObjectId(documentId, itemId);

        let eventData = {
            selected: true,
            userId: userId,
            selectId: selectId,
            userImageId: userImageId,
            userEmail: userEmail,
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

function deleteSelection(itemSelectId, selectId, sessionId, documentId, itemId) {
    let item = selectedDocumentItems[itemSelectId];
    if (!item) {
        return;
    }
    let userSelection = item.users.find((selection) => selection.selectId === selectId);
    if (!userSelection) {
        return;
    }
    let index = item.users.indexOf(userSelection);
    item.users.splice(index, 1);
    let objectId = SubscriptionManager.getObjectId(documentId, itemId);
    if (userSelection.selectId === item.lockOwner) {
        item.lockOwner = undefined;
    }
    let eventData = {
        selected: false,
        selectId: selectId,
        lockOwner: item.lockOwner
    }
    SubscriptionManager.notifyClients(sessionId, objectId, eventData);
    if (item.users.length === 0) {
        delete selectedDocumentItems[item];
    }
}

function refineTextContent(text) {
    if (typeof text !== "string") {
        return [{text: text, color: "black"}];
    }

    const instructionPatterns = [
        /Your task is to write.*?\*\*Paragraph Idea\*\*/gis,
        /{.*?("text":\s*".*?")?.*?}/gis,
        /instructions?\s*[:\-]/i,
        /Book Details.*?paragraphs\s*:\s*\[\s*\]/gis,
        /Chapter Details.*?paragraphs\s*:\s*\[\s*\]/gis,
        /Preparing for Generation\.\.\./gis,
        /Generating\.\.\./gis,
        /Expanding paragraph\s*[:\-]\s*undefined/gi,
        /Error\s*[:\-]\s*\w+/gi,
        /Failed\s*[:\-]\s*\w+/gi,
        /Processing\s*[:\-]\s*\w+/gi,
    ];

    const errorWords = new Set(["error", "undefined", "null"]);

    const paragraphs = text.split(/\n{2,}/);

    return paragraphs.map((paragraph) => {
        const words = paragraph.match(/\b\w+\b/g) || [];
        const hasErrorWord = words.some((word) => errorWords.has(word.toLowerCase()));

        const isInstruction = instructionPatterns.some((pattern) => pattern.test(paragraph));
        return {
            text: paragraph,
            color: hasErrorWord || isInstruction ? "red" : "black",
        };
    });
}


async function exportDocumentAsDocx(request, response) {
    const spaceId = request.params.spaceId;
    const documentId = request.params.documentId;
    const SecurityContext = require("assistos").ServerSideSecurityContext;
    let securityContext = new SecurityContext(request);
    const documentModule = require("assistos").loadModule("document", securityContext);
    try {
        let documentData = await documentModule.getDocument(spaceId, documentId);
        const paragraphs = [];

        if (documentData.title) {
            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Book title: ${documentData.title}`,
                            bold: true,
                            size: 28,
                        }),
                    ],
                    spacing: {
                        after: 200,
                    },
                })
            );
        }

        if (documentData.chapters && documentData.chapters.length > 0) {
            documentData.chapters.forEach((chapter, chapterIndex) => {
                if (chapter.title) {
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Chapter ${chapterIndex + 1}: ${chapter.title}`,
                                    bold: true,
                                    size: 24,
                                }),
                            ],
                            spacing: {
                                after: 150,
                            },
                        })
                    );
                }

                if (chapter.paragraphs && chapter.paragraphs.length > 0) {
                    chapter.paragraphs.forEach((paragraph) => {
                        if (paragraph.text) {
                            const refinedContent = refineTextContent(paragraph.text);
                            const runs = refinedContent.map((sentence) => {
                                return new TextRun({
                                    text: sentence.text,
                                    color: sentence.color === "red" ? "FF0000" : "000000",
                                    size: 22,
                                });
                            });

                            paragraphs.push(
                                new Paragraph({
                                    children: runs,
                                    spacing: {
                                        after: 100,
                                    },
                                })
                            );
                        }
                    });
                }
            });
        } else {
            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Nu există capitole în acest document.",
                            italic: true,
                            size: 22,
                        }),
                    ],
                })
            );
        }

        const doc = new Document({
            sections: [
                {
                    children: paragraphs,
                },
            ],
        });

        const buffer = await Packer.toBuffer(doc);
        return utils.sendResponse(response, 200, "application/octet-stream", buffer);
    } catch (error) {
        return utils.sendResponse(response, error.statusCode || 500, "application/json", error.message)
    }
}

async function undoOperation(request, response) {
    const spaceId = request.params.spaceId;
    const documentId = request.params.documentId;
    try {
        let success = await documentService.undoOperation(spaceId, documentId);
        return utils.sendResponse(response, 200, "application/json", success);
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", error.message);
    }
}
async function redoOperation(request, response) {
    const spaceId = request.params.spaceId;
    const documentId = request.params.documentId;
    try {
        let success = await documentService.redoOperation(spaceId, documentId);
        return utils.sendResponse(response, 200, "application/json", success);
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", error.message);
    }
}

async function addDocumentSnapshot(request, response) {
    const spaceId = request.params.spaceId;
    const documentId = request.params.documentId;
    const snapshotData = request.body;
    const SecurityContextClass = require('assistos').ServerSideSecurityContext;
    let securityContext = new SecurityContextClass(request);
    let documentModule = require('assistos').loadModule('document', securityContext);
    try {
        let document = await documentModule.getDocument(spaceId, documentId);
        document.type = "snapshot";
        document.abstract = JSON.stringify({originalDocumentId: documentId, ...snapshotData});
        delete document.id;
        document.snapshots = [];
        snapshotData.documentId = await documentModule.addDocument(spaceId, document);
        let {id, position} = await lightDB.addEmbeddedObject(spaceId, `${documentId}/snapshots`, snapshotData);
        snapshotData.id = id;
        utils.sendResponse(response, 200, "application/json", snapshotData);
    } catch (e) {
       utils.sendResponse(response, 500, "application/json", {
         message: e.message
       });
    }
}
async function getDocumentSnapshots(request, response) {
    const spaceId = request.params.spaceId;
    const documentId = request.params.documentId;
    try {
        let snapshots = await documentService.getSnapshots(spaceId, documentId);
        utils.sendResponse(response, 200, "application/json", snapshots);
    } catch (e) {
        utils.sendResponse(response, 500, "application/json", {
            message: e.message
        });
    }
}
async function restoreDocumentSnapshot(request, response) {
    const spaceId = request.params.spaceId;
    const documentId = request.params.documentId;
    const snapshotId = request.params.snapshotId;
    let newSnapshotData = request.body;
    try {
        let restoreSnapshot = await lightDB.getRecord(spaceId, documentId, snapshotId);
        let restoreDocumentId = restoreSnapshot.data.documentId;
        let restoreSnapshotDocument = await documentService.getDocument(spaceId, restoreDocumentId, {});
        let document = await documentService.getDocument(spaceId, documentId, {});

        let originalDocumentType = document.type;
        let originalDocumentAbstract = document.abstract;
        let originalDocumentSnapshots = JSON.parse(JSON.stringify(document.snapshots));
        //create new snapshot
        let newSnapshotDocument = JSON.parse(JSON.stringify(document));
        newSnapshotDocument.type = "snapshot";
        newSnapshotDocument.abstract = JSON.stringify({originalDocumentId: documentId, ...newSnapshotData});
        delete newSnapshotDocument.id;
        newSnapshotDocument.snapshots = [];
        newSnapshotData.documentId = await documentService.createDocument(spaceId, newSnapshotDocument);
        //restore snapshot
        document = JSON.parse(JSON.stringify(restoreSnapshotDocument));
        document.id = documentId;
        document.type = originalDocumentType;
        document.abstract = originalDocumentAbstract;
        document.snapshots = originalDocumentSnapshots;
        document.snapshots = document.snapshots.filter(snapshot => snapshot.id !== snapshotId);
        document.snapshots.push(newSnapshotData);
        await documentService.updateDocument(spaceId, documentId, document, {});
        await documentService.deleteDocument(spaceId, restoreDocumentId);
        utils.sendResponse(response, 200, "application/json", {});
    } catch (e) {
        utils.sendResponse(response, 500, "application/json", {
            message: e.message
        });
    }
}
async function deleteDocumentSnapshot(request, response) {
    const spaceId = request.params.spaceId;
    const documentId = request.params.documentId;
    const snapshotId = request.params.snapshotId;
    try {
        let snapshotRecord = await lightDB.getRecord(spaceId, documentId, snapshotId);
        await lightDB.deleteContainerObject(spaceId, snapshotRecord.data.documentId);
        await lightDB.deleteEmbeddedObject(spaceId, `${documentId}/${snapshotId}`);
        utils.sendResponse(response, 200, "application/json", {});
    } catch (e) {
        utils.sendResponse(response, 500, "application/json", {
            message: e.message
        });
    }
}

async function proxyDocumentConversion(req, res) {
    let tempDir = null;
    try {
        // Validate content type
        if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
            return sendResponse(res, 400, 'application/json', {
                message: "Expected multipart/form-data content type"
            });
        }
        
        // Get config for docsConverterUrl
        const config = require('../../../apihub-root/assistOS-configs.json');
        let docsConverterUrl = config.docsConverterUrl;
        
        // Create a temporary directory for the uploaded file
        tempDir = path.join(__dirname, '../../../data-volume/Temp', crypto.generateSecret(16));
        await fsPromises.mkdir(tempDir, { recursive: true });
        const tempFilePath = path.join(tempDir, `upload_${Date.now()}.bin`);
        
        // Initialize upload file object
        let uploadedFile = { ready: false };
        
        // Process the multipart form with Busboy
        const busboyOptions = { headers: req.headers, limits: { fileSize: 50 * 1024 * 1024 } };
        let busboy;
        
        try {
            busboy = new Busboy(busboyOptions);
        } catch (err) {
            busboy = Busboy(busboyOptions);
        }
        
        // Process file uploads
        busboy.on('file', (fieldname, fileStream, fileInfo) => {
            const writeStream = fs.createWriteStream(tempFilePath);
            let fileSize = 0;
            
            fileStream.on('data', (chunk) => {
                fileSize += chunk.length;
            });
            
            fileStream.pipe(writeStream);
            
            writeStream.on('finish', () => {
                // Extract filename and mimetype, handling both string and object formats
                let filename = 'document.bin';
                let mimetype = 'application/octet-stream';
                
                if (typeof fileInfo === 'object' && fileInfo !== null) {
                    filename = fileInfo.filename || 'document.bin';
                    mimetype = fileInfo.mimeType || 'application/octet-stream';
                } else if (typeof fileInfo === 'string') {
                    filename = fileInfo;
                }
                
                uploadedFile = {
                    fieldname,
                    filepath: tempFilePath,
                    filename,
                    mimetype,
                    size: fileSize,
                    ready: true
                };
            });
            
            writeStream.on('error', (err) => {
                console.error(`[DocConverter] Error saving file: ${err.message}`);
            });
        });
        
        // Process finish event
        busboy.on('finish', async () => {
            // Wait for file to be ready
            let attempts = 0;
            const maxAttempts = 50;
            
            while ((!uploadedFile || !uploadedFile.ready) && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            try {
                if (!uploadedFile || !uploadedFile.ready) {
                    throw new Error('File upload timed out or failed');
                }
                
                // Use curl command to send the file to the converter
                // This is the most reliable way to send multipart/form-data to Flask
                const { spawn } = require('child_process');
                const curl = spawn('curl', [
                    '-s',
                    '-X', 'POST',
                    '-F', `file=@${uploadedFile.filepath};filename=${uploadedFile.filename};type=${uploadedFile.mimetype}`,
                    `${docsConverterUrl}/convert`
                ]);
                
                let responseData = '';
                let errorData = '';
                
                curl.stdout.on('data', (data) => {
                    responseData += data.toString();
                });
                
                curl.stderr.on('data', (data) => {
                    errorData += data.toString();
                });
                
                const exitCode = await new Promise((resolve) => {
                    curl.on('close', resolve);
                });
                
                if (exitCode === 0 && responseData) {
                    try {
                        const data = JSON.parse(responseData);
                        if (data.text_content) {
                            return sendResponse(res, 200, 'application/json', data);
                        } else {
                            return sendResponse(res, 500, 'application/json', {
                                message: 'Invalid document structure returned from converter'
                            });
                        }
                    } catch (err) {
                        return sendResponse(res, 500, 'application/json', {
                            message: 'Invalid JSON response from converter'
                        });
                    }
                } else {
                    return sendResponse(res, 500, 'application/json', {
                        message: `Error from docs converter: ${errorData || 'Unknown error'}`
                    });
                }
            } catch (error) {
                console.error(`[DocConverter] Conversion error: ${error.message}`);
                return sendResponse(res, 500, 'application/json', {
                    message: `Error proxying document conversion: ${error.message}`
                });
            } finally {
                // Clean up temp directory
                if (tempDir) {
                    try {
                        await fsPromises.rm(tempDir, { recursive: true, force: true });
                    } catch (err) {
                        // Ignore cleanup errors
                    }
                }
            }
        });
        
        busboy.on('error', (err) => {
            console.error(`[DocConverter] Form parsing error: ${err.message}`);
            return sendResponse(res, 500, 'application/json', {
                message: `Error processing form data: ${err.message}`
            });
        });
        
        // Pipe the request to busboy
        req.pipe(busboy);
    } catch (error) {
        console.error(`[DocConverter] Setup error: ${error.message}`);
        // Clean up temp directory if it exists
        if (tempDir) {
            try {
                await fsPromises.rm(tempDir, { recursive: true, force: true });
            } catch (err) {
                // Ignore cleanup errors
            }
        }
        return sendResponse(res, 500, 'application/json', {
            message: `Error processing document conversion: ${error.message}`
        });
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
    downloadDocumentVideo,
    exportDocumentAsDocx,
    undoOperation,
    redoOperation,
    getDocumentSnapshots,
    addDocumentSnapshot,
    deleteDocumentSnapshot,
    restoreDocumentSnapshot,
    proxyDocumentConversion
}
