const documentModule = require("assistos").loadModule("document", {});
const utilModule = require("assistos").loadModule("util", {});
export class DocumentTasksMenu{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.newTasksCount = 0;
        this.documentId = this.element.getAttribute("data-document-id");
        this.loadTasks = async ()=>{
            let tasks = await documentModule.getDocumentTasks(assistOS.space.id, this.documentId);
            if(this.tasks){
                this.calculateNewTasks(tasks);
            }
            this.tasks = tasks;
        }
        assistOS.space.observeChange(this.documentId + "/tasks", this.invalidate, this.loadTasks);

        this.invalidate(async () => {
            await utilModule.subscribeToObject(this.documentId + "/tasks", async (status) => {
                this.invalidate(this.loadTasks);
            });
            await this.loadTasks();
        })
    }
    calculateNewTasks(newTasks){
        for(let task of newTasks){
            if(task.status !== "created"){
                continue;
            }
            if(!this.tasks.find(t => t.id === task.id)){
                this.newTasksCount++;
            }
        }
    }
    beforeRender(){
        let tasksList = "";
        for(let task of this.tasks){
            tasksList += `<task-item data-id="${task.id}" data-name="${task.name}" data-status=${task.status} data-presenter="task-item"></task-item>`;
        }
        this.tasksList = tasksList;
        this.renderBadge();
    }
    renderBadge(){
        let newTasksBadge = document.querySelector(".new-tasks-badge");
        if(newTasksBadge){
            newTasksBadge.remove();
        }
        if(this.newTasksCount > 0){
            let newTasksBadge = `<div class="new-tasks-badge">${this.newTasksCount}</div>`;
            let tasksContainer = this.element.closest(".tasks-container");
            tasksContainer.insertAdjacentHTML("afterbegin", newTasksBadge);
        }
    }
    afterRender(){
        if(this.tasks.length === 0){
            this.element.innerHTML = `<div class="no-tasks">No tasks yet</div>`;
        }
    }
    async runAllTasks(){
        for(let task of this.tasks){
            if(task.status === "created" || task.status === "cancelled"){
                utilModule.runTask(task.id);
            }
        }
    }
    async afterUnload(){
        await utilModule.unsubscribeFromObject(this.documentId + "/tasks");
    }
}