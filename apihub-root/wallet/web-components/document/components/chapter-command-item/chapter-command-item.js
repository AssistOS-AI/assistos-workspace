const utilModule = require("assistos").loadModule("util", {});
const documentModule = require("assistos").loadModule("document", {});

export class ChapterCommandItem{
    constructor(element, invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.type = this.element.getAttribute("data-type");
        let chapterId = this.element.getAttribute("data-chapter-id");
        let tasksModal = this.element.closest("document-tasks-modal");
        this.chapter = tasksModal.webSkelPresenter.document.chapters.find(chapter => chapter.id === chapterId);
        this.chapterItem = document.querySelector(`chapter-item[data-chapter-id="${chapterId}"]`);
        this.chapterPresenter = this.chapterItem.webSkelPresenter;
        let command = this.chapter.commands[this.type];
        this.invalidate(async ()=>{
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
        compileVideo: "ChapterToVideo"
    }
    async beforeRender(){
        this.name = this.tasksNameMap[this.type];
        this.status = "None";
        this.text = this.chapter.title || "...........";
        this.agent = "none";
    }
    afterRender(){

    }

    scrollDocument(){
        let chapterIndex = this.chapterPresenter.document.getChapterIndex(this.chapter.id);
        if (chapterIndex === this.chapterPresenter.document.chapters.length - 1) {
            return this.chapterItem.scrollIntoView({behavior: "smooth", block: "nearest"});
        }
        this.chapterItem.scrollIntoView({behavior: "smooth", block: "center"});
    }

    async deleteTask(){
        if(this.chapter.commands[this.type].taskId){
            await utilModule.deleteTask(this.chapter.commands[this.type].taskId);
        }
        delete this.chapter.commands[this.type];
        await documentModule.updateChapterCommands(assistOS.space.id, this.chapter.documentId, this.chapter.id, this.chapter.commands);
        this.element.remove();
    }
}