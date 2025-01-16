const utilModule = require("assistos").loadModule("util", {});
const documentModule = require("assistos").loadModule("document", {});

export class ParagraphCommandItem{
    constructor(element, invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.type = this.element.getAttribute("data-type");
        let paragraphId = this.element.getAttribute("data-paragraph-id");
        let chapterId = this.element.getAttribute("data-chapter-id");
        let tasksModal = this.element.closest("document-tasks-modal");
        let tasksModalPresenter = tasksModal.webSkelPresenter;
        this.document = tasksModalPresenter.document;
        let chapter = this.document.chapters.find(chapter => chapter.id === chapterId);
        this.paragraph = chapter.paragraphs.find(paragraph => paragraph.id === paragraphId);
        this.paragraphItem = document.querySelector(`paragraph-item[data-paragraph-id="${paragraphId}"]`);
        this.paragraphPresenter = this.paragraphItem.webSkelPresenter;

        let command = this.paragraph.commands[this.type];
        this.invalidate(async () => {
            if(command.taskId){
                this.boundOnTasksUpdate = this.onTasksUpdate.bind(this);
                await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, command.taskId, this.boundOnTasksUpdate);
            }
        });
    }
    onTasksUpdate(status){
        this.status = status;
        this.invalidate();
    }
    tasksNameMap = {
        speech: "TextToSpeech",
        lipsync: "LipSync",
        compileVideo: "ParagraphToVideo"
    }
    async beforeRender(){
        this.name = this.tasksNameMap[this.type];
        this.status = "None";
        this.paragraphText = this.paragraphPresenter.paragraph.text || "...........";
        if(this.paragraphPresenter.paragraph.commands.speech){
            this.agent = this.paragraphPresenter.paragraph.commands.speech.personality;
            this.personalityImageSrc = await this.paragraphPresenter.documentPresenter.getPersonalityImageByName(this.agent);
        } else {
            this.agent = "none";
            this.personalityImageSrc = "./wallet/assets/images/default-personality.png";
        }
    }
    afterRender(){

    }

    scrollDocument(){
        let paragraphIndex = this.paragraphPresenter.chapter.getParagraphIndex(this.paragraph.id);
        if (paragraphIndex === this.paragraphPresenter.chapter.paragraphs.length - 1) {
            return this.paragraphItem.scrollIntoView({behavior: "smooth", block: "nearest"});
        }
        this.paragraphItem.scrollIntoView({behavior: "smooth", block: "center"});
    }

    async deleteTask(){
        if(this.paragraph.commands[this.type].taskId){
            await utilModule.deleteTask(this.paragraph.commands[this.type].taskId);
        }
        delete this.paragraph.commands[this.type];
        await documentModule.updateParagraphCommands(assistOS.space.id, this.document.id, this.paragraph.id, this.paragraph.commands);
        this.element.remove();
    }
}