const Task = require("./Task");
const constants = require('./constants');
const STATUS = constants.STATUS;
const EVENTS = constants.EVENTS;
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
        let result = await this.llmModule.generateText(this.spaceId, prompt, this.personalityId);
        return result.message;
    }
    async runTask() {
        this.llmModule = await this.loadModule("llm");
        this.utilModule = await this.loadModule("util");
        let documentModule = await this.loadModule("document");
        let document = await documentModule.getDocument(this.spaceId, this.documentId);


        let translatedTitle = await this.translateText(document.title);
        const docId = await documentModule.addDocument(this.spaceId, {
            title: translatedTitle,
            topic: "",
            metadata: ["id", "title"]
        });

        for (let chapter of document.chapters) {
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
                    if (paragraph.commands.speech.taskId) {
                        paragraph.commands.speech.taskId = await documentModule.createTextToSpeechTask(this.spaceId, docId, paragraph.id);
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
        }

    }
    async cancelTask() {
        await this.rollback();
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