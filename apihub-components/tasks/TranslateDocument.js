const Task = require("./Task");
const constants = require('./constants');
const STATUS = constants.STATUS;
const EVENTS = constants.EVENTS;
let TaskManager = require('./TaskManager');
class TranslateDocument extends Task {
    constructor(spaceId, userId, configs) {
        super(spaceId, userId);
        this.documentId = configs.documentId;
        this.language = configs.language;
        this.personalityId = configs.personalityId;
    }
    async translateText(text) {
        text = this.utilModule.unsanitize(text);
        let prompt = `Please translate the following text to ${this.language}: ${text}. Return only the translated text.`;
        let timeout = setTimeout(()=>{
            this.reject("Translation timed out");
        }, 60000 * 3);
        let result = await this.llmModule.generateText(this.spaceId, prompt, this.personalityId);
        clearTimeout(timeout);
        return result.message;
    }
    runTask() {
        return new Promise(async (resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;

            this.llmModule = await this.loadModule("llm");
            this.utilModule = await this.loadModule("util");
            this.personalityModule = await this.loadModule("personality");
            let documentModule = await this.loadModule("document");
            this.documentModule = documentModule;
            let document = await documentModule.getDocument(this.spaceId, this.documentId);
            let paragraphTasksPromises = [];

            let translatedTitle = await this.translateText(document.title);
            const docId = await documentModule.addDocument(this.spaceId, {
                title: translatedTitle,
                topic: "",
                metadata: ["id", "title"]
            });
            this.newDocumentId = docId;
            for (let chapter of document.chapters) {
                let invalidateChapterVideo = false;
                let translatedTitle = await this.translateText(chapter.title);
                let translatedComment = await this.translateText(chapter.comment);
                let chapterObject = {
                    title: translatedTitle,
                    position: chapter.position,
                    backgroundSound: chapter.backgroundSound,
                    paragraphs:[],
                    idea: chapter.idea,
                    mainIdeas: chapter.mainIdeas,
                    comment: translatedComment,
                    commands: chapter.commands,
                    visibility: chapter.visibility
                };
                const chapterId = await documentModule.addChapter(this.spaceId, docId, chapterObject);

                for (let paragraph of chapter.paragraphs) {
                    paragraph.text = await this.translateText(paragraph.text);
                    paragraph.comment = await this.translateText(paragraph.comment);
                    paragraph.id = await documentModule.addParagraph(this.spaceId, docId, chapterId, paragraph);
                    if (paragraph.commands.speech) {
                        let personality = await this.personalityModule.getPersonalityByName(this.spaceId, paragraph.commands.speech.personality);
                        let audioLanguages = await this.llmModule.getModelLanguages(this.spaceId, personality.llms["audio"]);
                        if(audioLanguages.includes(this.language)){
                            paragraph.commands.speech.taskId = await documentModule.createTextToSpeechTask(this.spaceId, docId, paragraph.id);
                            paragraphTasksPromises.push(this.runParagraphTask(paragraph.commands.speech.taskId));
                            delete paragraph.commands.compileVideo;
                            invalidateChapterVideo = true;
                            await documentModule.updateParagraphCommands(this.spaceId, docId, paragraph.id, paragraph.commands);
                        }
                    }
                    if (paragraph.commands.lipsync) {
                        if (paragraph.commands.lipsync.taskId) {
                            paragraph.commands.lipsync.taskId = await documentModule.createLipSyncTask(this.spaceId, docId, paragraph.id);
                            await documentModule.updateParagraphCommands(this.spaceId, docId, paragraph.id, paragraph.commands);
                        }
                    }
                }
                if(invalidateChapterVideo){
                    let chapterCommands = await documentModule.getChapterCommands(this.spaceId, docId, chapterId);
                    delete chapterCommands.compileVideo;
                    await documentModule.updateChapterCommands(this.spaceId, docId, chapterId, chapterCommands);
                }
            }
            try{
                await Promise.all(paragraphTasksPromises);
            } catch (e) {
                console.error(e);
                //some paragraph tasks failed, error will be shown in tasks list
            }

            this.resolve(docId);
        });
    }
    runParagraphTask(taskId){
        return new Promise(async (resolve, reject) => {
            let task = TaskManager.getTask(taskId);
            task.on(EVENTS.DEPENDENCY_COMPLETED, resolve);
            task.on(EVENTS.DEPENDENCY_FAILED, reject);
            TaskManager.runTask(taskId);
        });
    }

    async cancelTask() {
        this.reject(new Error("Task cancelled"));
    }
    serialize() {
        return {
            status: this.status,
            id: this.id,
            spaceId: this.spaceId,
            userId: this.userId,
            name: this.constructor.name,
            failMessage: this.failMessage,
            configs: {
                documentId: this.documentId,
                language: this.language,
                personalityId: this.personalityId
            }
        }
    }
    async getRelevantInfo() {
        let info = {}
        if(this.status === STATUS.FAILED){
            info.failMessage = this.failMessage;
        }
        return info;
    }
}
module.exports = TranslateDocument;