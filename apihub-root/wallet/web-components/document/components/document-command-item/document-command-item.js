const utilModule = require("assistos").loadModule("util", {});
const documentModule = require("assistos").loadModule("document", {});

export class ChapterCommandItem{
    constructor(element, invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.type = this.element.getAttribute("data-type");
        let tasksModal = this.element.closest("document-tasks-modal");
        this.document = tasksModal.document;
        let command = this.document.commands[this.type];
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
        compileVideo: "DocumentToVideo"
    }
    async beforeRender(){
        this.name = this.tasksNameMap[this.type];
        this.status = "None";
        this.text = "this Document";
        this.agent = "none";
    }
    afterRender(){

    }

    async deleteTask(){
        if(this.document.commands[this.type].taskId){
            await utilModule.deleteTask(this.document.commands[this.type].taskId);
        }
        delete this.document.commands[this.type];
        await documentModule.updateDocumentCommands(assistOS.space.id, this.document.id, this.document.commands);
        this.element.remove();
    }
}