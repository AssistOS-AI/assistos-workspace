const space = require("../../spaces-storage/space");
const utils = require("../../apihub-component-utils/utils");
const archiver = require("archiver");
const crypto = require("../../apihub-component-utils/crypto");
const path = require("path");
const fs = require("fs");
const Busboy = require("busboy");
const unzipper = require("unzipper");
const enclave = require('opendsu').loadAPI('enclave');

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
    //TODO: use this full/partial export
    try {
        const archiveStream = await archiveDocument(spaceId, documentId, exportType);

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
async function archiveDocument(spaceId, documentId, exportType) {
    const documentData = await exportDocumentData(spaceId, documentId);
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
async function exportDocumentData(spaceId, documentId) {
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
    let personalities = new Set();

    let documentData = {
        title: documentRecord.title,
        topic: documentRecord.topic,
        metadata: documentRecord.metadata,
        /* TODO documents dont have a saved abstract field - talk with Mircea */
        abstract: documentRecord.abstract || "",
        chapters: documentRecord.chapters.map((chapterId, chapterIndex) => {
            let chapter = {}
            chapter.title = documentRecordsContents[chapterId].title
            if (documentRecordsContents[chapterId].backgroundSound) {
                chapter.backgroundSound = documentRecordsContents[chapterId].backgroundSound
                chapter.backgroundSound.fileName = `Chapter_${chapterIndex + 1}_audio`
                audios.push({
                    name: chapter.backgroundSound.fileName,
                    id: documentRecordsContents[chapterId].backgroundSound.id
                })
            }
            chapter.position = documentRecordsContents[chapterId].position
            chapter.id = chapterId
            chapter.paragraphs = documentRecordsContents[chapterId].paragraphs.map((paragraphId, paragraphIndex) => {
                let paragraph = {
                    text: documentRecordsContents[paragraphId].text,
                    position: documentRecordsContents[paragraphId].position,
                    id: paragraphId,
                    commands: documentRecordsContents[paragraphId].commands
                };

                if (documentRecordsContents[paragraphId].commands.audio) {
                    const personality = documentRecordsContents[paragraphId].commands["speech"].paramsObject.personality;
                    paragraph.commands.audio = documentRecordsContents[paragraphId].commands.audio;
                    paragraph.commands.audio.fileName = `Chapter_${chapterIndex + 1}_Paragraph_${paragraphIndex + 1}_audio`
                    audios.push({
                        name: paragraph.commands.audio.fileName,
                        id: documentRecordsContents[paragraphId].commands.audio.id
                    })
                    personalities.add(personality);
                }
                if (documentRecordsContents[paragraphId].commands.image) {
                    paragraph.commands.image = documentRecordsContents[paragraphId].commands.image;
                    paragraph.commands.image.fileName = `Chapter_${chapterIndex + 1}_Paragraph_${paragraphIndex + 1}_image`
                    images.push({
                        name: paragraph.commands.image.fileName,
                        id: documentRecordsContents[paragraphId].commands.image.id
                    })
                    paragraph.commands.image.dimensions = documentRecordsContents[paragraphId].commands.image.dimensions;
                }
                return paragraph
            })
            return chapter;
        })
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

    for (const chapter of docData.chapters) {
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
            if (paragraphObject.commands.image) {
                const imagePath = path.join(extractedPath, 'images', `${paragraphObject.commands.image.fileName}.png`);
                const imageBase64Data = await space.APIs.readFileAsBase64(imagePath);
                const dataUrl = `data:image/png;base64,${imageBase64Data}`;
                const imageId = await spaceModule.addImage(spaceId, dataUrl);
                paragraphObject.commands.image.id = imageId;
                paragraphObject.commands.image.src = `spaces/image/${spaceId}/${imageId}`;
            }

            if (paragraphObject.commands.audio) {
                const audioPath = path.join(extractedPath, 'audios', `${paragraphObject.commands.audio.fileName}.mp3`);
                const audioBase64Data = await space.APIs.readFileAsBase64(audioPath);
                const audioId = await spaceModule.addAudio(spaceId, audioBase64Data);
                paragraphObject.commands.audio.id = audioId;
                paragraphObject.commands.audio.src = `spaces/audio/${spaceId}/${audioId}`;
            }
            await documentModule.addParagraph(spaceId, docId, chapterId, paragraphObject);
        }
    }

    fs.rmSync(extractedPath, {recursive: true, force: true});
    return {id: docId, overriddenPersonalities: Array.from(overriddenPersonalities)};
}

module.exports = {
    getDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    exportDocument,
    importDocument
}
