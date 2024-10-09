const space = require("../../spaces-storage/space");
const utils = require("../../apihub-component-utils/utils");
const archiver = require("archiver");
const crypto = require("../../apihub-component-utils/crypto");
const path = require("path");
const fs = require("fs");
const Busboy = require("busboy");
const unzipper = require("unzipper");
const eventPublisher = require("../../subscribers/eventPublisher");
const ffmpeg = require("../../apihub-component-utils/ffmpeg");
const {sendResponse} = require("../../apihub-component-utils/utils");
const Storage = require("../../apihub-component-utils/storage");
const documentService = require("../services/document");

async function getDocument(req, res) {
    const {spaceId, documentId} = req.params;
    if (!spaceId || !documentId) {
        return utils.sendResponse(res, 400, "application/json", {
            success: false,
            message: "Invalid request" + `Missing ${!spaceId ? "spaceId" : ""} ${!documentId ? "documentId" : ""}`
        });
    }
    try {
        const document = await documentService.getDocument(spaceId, documentId,req.query);
        utils.sendResponse(res, 200, "application/json", {
            success: true,
            data: document
        });
    } catch (error) {
        utils.sendResponse(res, error.statusCode || 500, "application/json", {
            success: false,
            message: `Failed to retrieve document ${documentId}` + error.message
        });
    }

}
async function getDocumentsMetadata(req,res){
    const {spaceId} = req.params;
    if(!spaceId){
        return utils.sendResponse(res, 400, "application/json", {
            success: false,
            message: "Invalid request" + `Missing ${!spaceId ? "spaceId" : ""}`
        });
    }
    try{
        const metadata = await documentService.getDocumentsMetadata(spaceId);
        utils.sendResponse(res, 200, "application/json", {
            success: true,
            data: metadata
        });
    }catch(error){
        utils.sendResponse(res, error.statusCode || 500, "application/json", {
            success: false,
            message: `Failed to retrieve document metadata` + error.message
        });
    }
}

async function createDocument(req, res) {
    const {spaceId} = req.params;
    const documentData = req.body;
    if (!spaceId || !documentData) {
        return utils.sendResponse(res, 400, "application/json", {
            success: false,
            message: "Invalid request" + `Missing ${!spaceId ? "spaceId" : ""} ${!documentData ? "documentData" : ""}`
        });
    }
    try {
        const documentId = await documentService.createDocument(spaceId, documentData);
        eventPublisher.notifyClients(req.sessionId, "documents");
        utils.sendResponse(res, 200, "application/json", {
            success: true,
            data: documentId
        });
    } catch (error) {
        utils.sendResponse(res, error.statusCode || 500, "application/json", {
            success: false,
            message: "Failed to create document" + error.message
        });
    }
}

async function updateDocument(req, res) {
    const {spaceId, documentId} = req.params;
    const documentData = req.body;
    if (!spaceId || !documentId || !documentData) {
        return utils.sendResponse(res, 400, "application/json", {
            success: false,
            message: "Invalid request" + `Missing ${!spaceId ? "spaceId" : ""} ${!documentId ? "documentId" : ""} ${!documentData ? "request body" : ""}`
        });
    }
    try {
        await documentService.updateDocument(spaceId, documentId, documentData,req.query);
        eventPublisher.notifyClients(req.sessionId, documentId);
        eventPublisher.notifyClients(req.sessionId, "documents");
        utils.sendResponse(res, 200, "application/json", {
            success: true,
            message: `Document ${documentId} updated successfully`
        });
    } catch (error) {
        utils.sendResponse(res, error.statusCode || 500, "application/json", {
            success: false,
            message: `Failed to update document ${documentId}` + error.message
        });
    }
}


async function deleteDocument(req, res) {
    const {spaceId, documentId} = req.params;
    if (!spaceId || !documentId) {
        return utils.sendResponse(res, 400, "application/json", {
            success: false,
            message: "Invalid request" + `Missing ${!spaceId ? "spaceId" : ""} ${!documentId ? "documentId" : ""}`
        });
    }
    try {
        await documentService.deleteDocument(spaceId, documentId);
        eventPublisher.notifyClients(req.sessionId, documentId, "delete");
        eventPublisher.notifyClients(req.sessionId, "documents");
        utils.sendResponse(res, 200, "application/json", {
            success: true,
            message: `Document ${documentId} deleted successfully`
        });
    } catch (error) {
        utils.sendResponse(res, error.statusCode || 500, "application/json", {
            success: false,
            message: `Failed to delete document ${documentId}` + error.message
        });
    }

}

async function exportDocument(request, response) {
    const spaceId = request.params.spaceId;
    const documentId = request.params.documentId;
    const exportType = request.body.exportType;
    try {
        const archiveStream = await archiveDocument(spaceId, documentId, exportType, request);

        response.setHeader('Content-Disposition', `attachment; filename=${documentId}.docai`);
        response.setHeader('Content-Type', 'application/zip');

        archiveStream.pipe(response);
        archiveStream.on('end', () => {
            response.end();
        });
        archiveStream.on('error', err => {
            utils.sendResponse(response, 500, "application/json", {
                success: false,
                message: `Error at exporting document: ${documentId}. ${err.message}`
            })
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            success: false,
            message: `Error at exporting document: ${documentId}. ${error.message}`
        });
    }
}

async function archiveDocument(spaceId, documentId, exportType, request) {
    let documentData;
    const SecurityContext = require("assistos").ServerSideSecurityContext;
    let securityContext = new SecurityContext(request);
    const documentModule = require('assistos').loadModule('document', securityContext);
    if (exportType === 'full') {
        documentData = await exportDocumentData(documentModule, spaceId, documentId);
    } else {
        documentData = await exportDocumentDataPartially(documentModule, spaceId, documentId);
    }

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

    for(let imageData of documentData.images){
        const imageName = imageData.name;
        const {fileStream, headers} = await Storage.getImage(spaceId, audioData.id);
        archive.append(fileStream, {name: `images/${imageName}.png`});
    }

    for(let audioData of documentData.audios){
        const audioName = audioData.name;
        const {fileStream, headers} = await Storage.getAudio(spaceId, audioData.id);
        archive.append(fileStream, {name: `audios/${audioName}.mp3`});
    }
    for(let videoData of documentData.videos){
        const videoName = videoData.name;
        const {fileStream, headers} = await Storage.getVideo(spaceId, videoData.id);
        archive.append(fileStream, {name: `videos/${videoName}.mp4`});
    }

    for(let personalityId of documentData.personalities){
        const personalityStream = await space.APIs.archivePersonality(spaceId, personalityId);
        archive.append(personalityStream, {name: `personalities/${personalityId}.persai`});
    }

    archive.finalize();
    return stream;
}

async function exportDocumentDataPartially(documentModule, spaceId, documentId) {
    let personalities = new Set();
    let documentData = await documentModule.getDocument(spaceId, documentId);
    documentData.exportType = "partial";
    documentData.images = [];
    documentData.audios = [];
    documentData.videos = [];
    for (let chapter of documentData.chapters) {
        for (let paragraph of chapter.paragraphs) {
            if (paragraph.commands.audio) {
                const personality = paragraph.commands["speech"].personality;
                personalities.add(personality);
            }
        }
    }
    documentData.personalities = await space.APIs.getPersonalitiesIds(spaceId, personalities);
    return documentData;
}

async function exportDocumentData(documentModule, spaceId, documentId) {
    let documentData = await documentModule.getDocument(spaceId, documentId);
    /* TODO there seems to be a bug where multiple chapters have position 0 - talk with Mircea */
    documentData.exportType = "full";
    let audios = [];
    let images = [];
    let videos = [];
    let personalities = new Set();
    for (let chapter of documentData.chapters) {
        const chapterIndex = documentData.chapters.indexOf(chapter);
        if (chapter.backgroundSound) {
            chapter.backgroundSound.fileName = `Chapter_${chapterIndex + 1}_audio`
            audios.push({
                name: chapter.backgroundSound.fileName,
                id: chapter.backgroundSound.id
            })
        }
        for (let paragraph of chapter.paragraphs) {
            const paragraphIndex = chapter.paragraphs.indexOf(paragraph);
            if(paragraph.commands.audio) {
                paragraph.commands.audio.fileName = `Chapter_${chapterIndex + 1}_Paragraph_${paragraphIndex + 1}_audio`
                audios.push({
                    name: paragraph.commands.audio.fileName,
                    id: paragraph.commands.audio.id
                })
            }
            if(paragraph.commands.speech) {
                const personality = paragraph.commands["speech"].personality;
                personalities.add(personality);
            }
            if (paragraph.commands.image) {
                paragraph.commands.image.fileName = `Chapter_${chapterIndex + 1}_Paragraph_${paragraphIndex + 1}_image`
                images.push({
                    name: paragraph.commands.image.fileName,
                    id: paragraph.commands.image.id
                })
            }
            if (paragraph.commands.video) {
                paragraph.commands.video.fileName = `Chapter_${chapterIndex + 1}_Paragraph_${paragraphIndex + 1}_video`
                videos.push({
                    name: paragraph.commands.video.fileName,
                    id: paragraph.commands.video.id
                })
            }
        }
    }
    documentData.images = images;
    documentData.audios = audios;
    documentData.videos = videos;
    documentData.personalities = await space.APIs.getPersonalitiesIds(spaceId, personalities);
    return documentData;
}

async function importDocument(request, response) {
    const spaceId = request.params.spaceId;
    const fileId = crypto.generateSecret(64);
    const tempDir = path.join(__dirname, '../../../data-volume/Temp', fileId);
    const filePath = path.join(tempDir, `${fileId}.docai`);

    await fs.promises.mkdir(tempDir, {recursive: true});
    const busboy = Busboy({headers: request.headers});
    const taskId = crypto.generateId(16);
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
                eventPublisher.notifyClientTask(request.userId, taskId, importResults)
            } catch (error) {
                console.error('Error processing extracted files:', error);
                eventPublisher.notifyClientTask(request.userId, taskId, {error: error.message});
            } finally {
                await fs.promises.rm(tempDir, {recursive: true, force: true});
            }
        });

        writeStream.on('error', async (error) => {
            console.error('Error writing file:', error);
            eventPublisher.notifyClientTask(request.userId, taskId, {error: error.message});
        });
    });

    busboy.on('error', async (error) => {
        console.error('Busboy error:', error);
        eventPublisher.notifyClientTask(request.userId, taskId, {error: error.message});
    });

    request.pipe(busboy);
    utils.sendResponse(response, 200, "application/json", {
        success: true,
        message: 'Document imported successfully',
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
            position: chapter.position || 0
        };

        if (chapter.backgroundSound) {
            chapterObject.backgroundSound = chapter.backgroundSound;
            const audioPath = path.join(extractedPath, 'audios', `${chapter.backgroundSound.fileName}.mp3`);
            const buffer = await space.APIs.readFileAsBuffer(audioPath);
            const audioId = await spaceModule.putAudio(spaceId, buffer);
            chapterObject.backgroundSound.id = audioId;
            chapterObject.backgroundSound.src = `spaces/audio/${spaceId}/${audioId}`;
        }

        const chapterId = await documentModule.addChapter(spaceId, docId, chapterObject);
        //convertParagraphs(chapter);

        for (let paragraph of chapter.paragraphs) {
            if (exportType === 'full') {
                await storeAttachments(extractedPath, spaceModule, paragraph, spaceId);
            }
            await documentModule.addParagraph(spaceId, docId, chapterId, paragraph);
            if (paragraph.commands.speech) {
                if (paragraph.commands.speech.taskId) {
                    paragraph.commands.speech.taskId = await documentModule.generateParagraphAudio(spaceId, docId, paragraph.id);
                    await documentModule.updateParagraphCommands(spaceId, docId, paragraph.id, paragraph.commands);
                }
            }
            if (paragraph.commands.lipsync) {
                if (paragraph.commands.lipsync.taskId) {
                    paragraph.commands.lipsync.taskId = await documentModule.generateParagraphLipSync(spaceId, docId, paragraph.id);
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
        const buffer = await space.APIs.readFileAsBuffer(imagePath);
        paragraph.commands.image.id = await spaceModule.putImage(spaceId, buffer);
        delete paragraph.commands.image.fileName;
    }
    if (paragraph.commands.audio) {
        const audioPath = path.join(extractedPath, 'audios', `${paragraph.commands.audio.fileName}.mp3`);
        const buffer = await space.APIs.readFileAsBuffer(audioPath);
        paragraph.commands.audio.id = await spaceModule.putAudio(spaceId, buffer);
        delete paragraph.commands.audio.fileName;
    }
    if (paragraph.commands.video) {
        const videoPath = path.join(extractedPath, 'videos', `${paragraph.commands.video.fileName}.mp4`);
        const buffer = await space.APIs.readFileAsBuffer(videoPath);
        paragraph.commands.video.id = await spaceModule.putVideo(spaceId, buffer);
        delete paragraph.commands.video.fileName;
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
            success: true,
            message: `Estimation in progress`,
            data: duration
        });
    } catch (e) {
        sendResponse(response, 500, "application/json", {
            success: false,
            message: e.message
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
    estimateDocumentVideoLength
}
