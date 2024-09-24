const space = require("../../spaces-storage/space");
const utils = require("../../apihub-component-utils/utils");
const archiver = require("archiver");
const crypto = require("../../apihub-component-utils/crypto");
const path = require("path");
const fs = require("fs");
const Busboy = require("busboy");
const unzipper = require("unzipper");
const enclave = require('opendsu').loadAPI('enclave');
const TaskManager = require('../../tasks/TaskManager');
const Task = require('../../tasks/Task');
async function getDocument() {

}

async function createDocument() {

}

async function updateDocument() {

}

async function deleteDocument() {

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
    if(exportType === 'full') {
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

    documentData.images.forEach(imageData => {
        const imageName = imageData.name
        const imageStream = space.APIs.getImageStream(spaceId, imageData.id);
        archive.append(imageStream, {name: `images/${imageName}.png`});
    });

    documentData.audios.forEach(audioData => {
        const audioName = audioData.name;
        const audioStream = space.APIs.getAudioStream(spaceId, audioData.id);
        archive.append(audioStream, {name: `audios/${audioName}.mp3`});
    });
    documentData.videos.forEach(videoData => {
        const videoName = videoData.name;
        const videoStream = space.APIs.getVideoStream(spaceId, videoData.id);
        archive.append(videoStream, {name: `videos/${videoName}.mp4`});
    });

    function streamToBuffer(stream) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('data', (chunk) => {
                chunks.push(chunk);
            });
            stream.on('end', () => {
                resolve(Buffer.concat(chunks));
            });
            stream.on('error', reject);
        });
    }

    /* TODO could overflow the memory if there are too many personalities with large amount of data*/
    const personalityPromises = documentData.personalities.map(async personalityId => {
        const personalityStream = await space.APIs.archivePersonality(spaceId, personalityId);
        const personalityBuffer = await streamToBuffer(personalityStream);
        return {buffer: personalityBuffer, id: personalityId};
    });
    const personalities = await Promise.all(personalityPromises);
    personalities.forEach(({buffer, id}) => {
        archive.append(buffer, {name: `personalities/${id}.persai`});
    });
    archive.finalize();
    return stream;
}
async function exportDocumentDataPartially(documentModule, spaceId, documentId){
    let personalities = new Set();
    let documentData = await documentModule.getDocument(spaceId, documentId);
    documentData.exportType = "partial";
    documentData.images = [];
    documentData.audios = [];
    documentData.videos = [];
    for(let chapter of documentData.chapters) {
        for(let paragraph of chapter.paragraphs) {
            if(paragraph.commands.audio) {
                const personality = paragraph.commands["speech"].paramsObject.personality;
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
    for(let chapter of documentData.chapters) {
        const chapterIndex = documentData.chapters.indexOf(chapter);
        if(chapter.backgroundSound) {
            chapter.backgroundSound.fileName = `Chapter_${chapterIndex + 1}_audio`
            audios.push({
                name: chapter.backgroundSound.fileName,
                id: chapter.backgroundSound.id
            })
        }
        for(let paragraph of chapter.paragraphs) {
            const paragraphIndex = chapter.paragraphs.indexOf(paragraph);
            if(paragraph.commands.audio) {
                const personality = paragraph.commands["speech"].paramsObject.personality;
                paragraph.commands.audio.fileName = `Chapter_${chapterIndex + 1}_Paragraph_${paragraphIndex + 1}_audio`
                audios.push({
                    name: paragraph.commands.audio.fileName,
                    id: paragraph.commands.audio.id
                })
                personalities.add(personality);
            }
            if(paragraph.commands.image) {
                paragraph.commands.image.fileName = `Chapter_${chapterIndex + 1}_Paragraph_${paragraphIndex + 1}_image`
                images.push({
                    name: paragraph.commands.image.fileName,
                    id: paragraph.commands.image.id
                })
            }
            if(paragraph.commands.video){
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
    const tempDir = path.join(__dirname, '../../data-volume/Temp', fileId);
    const filePath = path.join(tempDir, `${fileId}.docai`);

    await fs.promises.mkdir(tempDir, {recursive: true});

    const busboy = Busboy({headers: request.headers});

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

                utils.sendResponse(response, 200, "application/json", {
                    success: true,
                    message: 'Document imported successfully',
                    data: importResults
                });
            } catch (error) {
                console.error('Error processing extracted files:', error);
                utils.sendResponse(response, 500, "application/json", {
                    success: false,
                    message: `Error at importing document: ${error.message}`
                });
            } finally {
                await fs.promises.rm(tempDir, {recursive: true, force: true});
            }
        });

        writeStream.on('error', (error) => {
            console.error('Error writing file:', error);
            utils.sendResponse(response, 500, "application/json", {
                success: false,
                message: `Error writing file: ${error.message}`
            });
        });
    });

    busboy.on('error', (error) => {
        console.error('Busboy error:', error);
        utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: `Busboy error: ${error.message}`
        });
    });

    request.pipe(busboy);
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
            const audioBase64Data = await space.APIs.readFileAsBase64(audioPath);
            const audioId = await spaceModule.addAudio(spaceId, audioBase64Data);
            chapterObject.backgroundSound.id = audioId;
            chapterObject.backgroundSound.src = `spaces/audio/${spaceId}/${audioId}`;
        }

        const chapterId = await documentModule.addChapter(spaceId, docId, chapterObject);
        for (let paragraph of chapter.paragraphs) {
            let paragraphObject = paragraph;
            if(exportType === 'full') {
                await storeAttachments(extractedPath, spaceModule, paragraphObject, spaceId);
            }
            await documentModule.addParagraph(spaceId, docId, chapterId, paragraphObject);
            if (paragraphObject.commands.speech) {
                if(paragraphObject.commands.speech.taskId) {
                    paragraphObject.commands.speech.taskId = await documentModule.generateParagraphAudio(spaceId, docId, paragraphObject.id);
                    await documentModule.updateParagraphCommands(spaceId, docId, paragraphObject.id, paragraphObject.commands);
                }
            }
            if(paragraphObject.commands.lipsync){
                if(paragraphObject.commands.lipsync.taskId){
                    paragraphObject.commands.lipsync.taskId = await documentModule.generateParagraphLipSync(spaceId, docId, paragraphObject.id);
                    await documentModule.updateParagraphCommands(spaceId, docId, paragraphObject.id, paragraphObject.commands);
                }
            }
        }
    }

    fs.rmSync(extractedPath, {recursive: true, force: true});
    return {id: docId, overriddenPersonalities: Array.from(overriddenPersonalities)};
}
async function storeAttachments(extractedPath, spaceModule, paragraphObject, spaceId){
    if (paragraphObject.commands.image) {
        const imagePath = path.join(extractedPath, 'images', `${paragraphObject.commands.image.fileName}.png`);
        const imageBase64Data = await space.APIs.readFileAsBase64(imagePath);
        const dataUrl = `data:image/png;base64,${imageBase64Data}`;
        paragraphObject.commands.image.id = await spaceModule.addImage(spaceId, dataUrl);
        delete paragraphObject.commands.image.fileName;
    }
    if (paragraphObject.commands.audio) {
        const audioPath = path.join(extractedPath, 'audios', `${paragraphObject.commands.audio.fileName}.mp3`);
        const audioBase64Data = await space.APIs.readFileAsBase64(audioPath);
        paragraphObject.commands.audio.id = await spaceModule.addAudio(spaceId, audioBase64Data);
        delete paragraphObject.commands.audio.fileName;
    }
    if(paragraphObject.commands.video) {
        const videoPath = path.join(extractedPath, 'videos', `${paragraphObject.commands.video.fileName}.mp4`);
        const videoBase64Data = await space.APIs.readFileAsBase64(videoPath);
        paragraphObject.commands.video.id = await spaceModule.addVideo(spaceId, videoBase64Data);
        delete paragraphObject.commands.video.fileName;
    }
}

module.exports = {
    getDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    exportDocument,
    importDocument
}
