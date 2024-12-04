const fs = require('fs');
const Task = require('./Task');
const path = require('path');
const space = require('../spaces-storage/space');
const Storage = require("../apihub-component-utils/storage");
const constants = require('./constants');
const archiver = require("archiver");
const STATUS = constants.STATUS;
class ExportDocument extends Task {
    constructor(spaceId, userId, configs) {
        super(spaceId, userId);
        this.processes = [];
        this.documentId = configs.documentId;
        this.exportType = configs.exportType;
    }
    async runTask(){
        return new Promise(async (resolve, reject) => {
            const documentModule = await this.loadModule('document');
            let document = await documentModule.getDocument(this.spaceId, this.documentId);

            let documentData;
            if (this.exportType === 'full') {
                documentData = await this.exportDocumentData(document);
            } else {
                documentData = await this.exportDocumentDataPartially(document);
            }

            const archive = archiver('zip', {zlib: {level: 9}});
            this.archive = archive;
            let spacePath = space.APIs.getSpacePath(this.spaceId);
            await fs.promises.mkdir(path.join(spacePath, "temp"), {recursive: true});
            let archiveName = `${this.id}.docai`;
            let outputPath = path.join(spacePath, "temp", archiveName);
            let outputStream = fs.createWriteStream(outputPath);

            archive.pipe(outputStream);
            archive.on('error', err => {
                setTimeout(() => {
                    const TaskManager = require('./TaskManager');
                    TaskManager.removeTask(this.id);
                }, 20000);
                reject(err);
            });
            outputStream.on('error', err => {
                reject(err);
            });
            archive.on('finish', () => {
                let downloadURL =`/documents/export/${this.spaceId}/${this.id}`;
                resolve(downloadURL);
            });

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
            archive.append(contentBuffer, {name: 'data.json'});
            archive.append(Buffer.from(JSON.stringify(metadata), 'utf-8'), {name: 'metadata.json'});
            try {
                console.log("appending personalities");
                for(let personalityId of documentData.personalities){
                    const personalityStream = await space.APIs.archivePersonality(this.spaceId, personalityId);
                    archive.append(personalityStream, {name: `personalities/${personalityId}.persai`});
                }
                console.log("appending images");
                await this.appendFilesInBatches(archive, documentData.images, Storage.fileTypes.images);
                await this.appendFilesInBatches(archive, documentData.audios, Storage.fileTypes.audios);
                await this.appendFilesInBatches(archive, documentData.videos, Storage.fileTypes.videos);
                await archive.finalize();
            } catch (e) {
                reject(e);
            }
        });
    }
    async appendFilesInBatches(archive, fileDataList, fileType, batchSize = 10) {
        for (let i = 0; i < fileDataList.length; i += batchSize) {
            console.log(`processing ${fileType} ${i} to ${i + batchSize}`);
            const batch = fileDataList.slice(i, i + batchSize);
            try {
                await Promise.all(batch.map(async (data) => {
                    const {fileStream, headers} = await Storage.getFile(fileType, data.id);
                    await new Promise((resolve, reject) => {
                        archive.append(fileStream, {name: `${fileType}/${data.name}.${fileType === Storage.fileTypes.images ? 'png' : fileType === Storage.fileTypes.audios ? 'mp3' : 'mp4'}`});
                        fileStream.on('end', resolve);
                        fileStream.on('error', reject);
                    });
                }));
            } catch (e) {
                throw new Error(`Batch ${i + batchSize} -> ${batch.length} failed. file type: ${fileType} : ${e.message}`);
            }
        }
    }
    async exportDocumentDataPartially(document) {
        let personalities = new Set();
        document.exportType = "partial";
        document.images = [];
        document.audios = [];
        document.videos = [];
        for (let chapter of document.chapters) {
            for (let paragraph of chapter.paragraphs) {
                if (paragraph.commands.speech) {
                    const personality = paragraph.commands.speech.personality;
                    personalities.add(personality);
                }
            }
        }
        document.personalities = await space.APIs.getPersonalitiesIds(this.spaceId, personalities);
        return document;
    }

    async exportDocumentData(document) {
        document.exportType = "full";
        let audios = [];
        let images = [];
        let videos = [];
        let personalities = new Set();
        for (let chapter of document.chapters) {
            const chapterIndex = document.chapters.indexOf(chapter);
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
                if (paragraph.commands.effects) {
                    for(let effect of paragraph.commands.effects){
                        effect.fileName = `Chapter_${chapterIndex + 1}_Paragraph_${paragraphIndex + 1}_effect_${effect.name}_${effect.id}`;
                        audios.push({
                            name: effect.fileName,
                            id: effect.id
                        })
                    }
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
                    if(paragraph.commands.video.thumbnailId){
                        paragraph.commands.video.thumbnailFileName = `${paragraph.commands.video.fileName}_thumbnail`
                        images.push({
                            name: paragraph.commands.video.thumbnailFileName,
                            id: paragraph.commands.video.thumbnailId
                        })
                    }
                }
            }
        }
        document.images = images;
        document.audios = audios;
        document.videos = videos;
        document.personalities = await space.APIs.getPersonalitiesIds(this.spaceId, personalities);
        return document;
    }
    async cancelTask(){
        this.archive.emit('error', "Task was cancelled");
        setTimeout(() => {
            const TaskManager = require('./TaskManager');
            TaskManager.removeTask(this.id);
        }, 5000);
    }


    serialize() {
        return{
            id: this.id,
            status: this.status,
            spaceId: this.spaceId,
            userId: this.userId,
            name: this.constructor.name,
            configs:{
                spaceId: this.spaceId,
                documentId: this.documentId,
            }
        }
    }


    async getRelevantInfo() {
        if (this.status === STATUS.RUNNING) {
            return `Exporting document ${this.document.title}`;
        }
        if (this.status === STATUS.FAILED) {
            return this.failMessage;
        }
        if (this.status === STATUS.COMPLETED) {
            return `Document ${this.document.title} export completed`;
        }
    }
}
module.exports = ExportDocument;
