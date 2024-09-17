const documentModule = require("assistos").loadModule("document", {});
const utilModule = require("assistos").loadModule("util", {});
export class DocumentTasksMenu{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.newTasksCount = 0;
        this.documentId = this.element.getAttribute("data-document-id");
        this.loadTasks = async () => {
            let tasks = await documentModule.getDocumentTasks(assistOS.space.id, this.documentId);
            if(this.tasks){
                this.calculateNewTasks(tasks);
            }
            this.tasks = tasks;
        };
        this.renderNewTasks = async () => {
            this.loadTasks().then(() => {
                let tasksList = this.element.querySelector(".tasks-list");
                let tasksItems = "";
                for(let task of this.tasks){
                    tasksItems += `<task-item data-id="${task.id}" data-name="${task.name}" data-status=${task.status} data-presenter="task-item"></task-item>`;
                }
                tasksList.innerHTML = tasksItems;
                this.renderBadge();
            });
        };
        assistOS.space.observeChange(this.documentId + "/tasks", this.renderNewTasks);

        this.invalidate(async () => {
            await utilModule.subscribeToObject(this.documentId + "/tasks", async (status) => {
                this.renderNewTasks();
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
        for(let task of this.tasks){
            if(task.status === "created" && !newTasks.find(t => t.id === task.id)){
                this.newTasksCount--;
            }
        }
    }
    beforeRender(){
        this.menuContent = ` 
        <div class="tasks-list-container">
             <div class="tasks-list">
             </div>
        </div>`;
        if(this.tasks.length > 0){
            let tasksList = "";
            for(let task of this.tasks){
                tasksList += `<task-item data-id="${task.id}" data-name="${task.name}" data-status=${task.status} data-presenter="task-item"></task-item>`;
            }
            this.menuContent = `
            <div class="tasks-list-container">
                <button class="general-button run-all-tasks" data-local-action="runAllTasks">Run all</button>
                <div class="tasks-header">
                    <div class="name-header">Name</div>
                    <div class="status-header">Status</div>
                    <div class="action-header">Action</div>
                </div>
                <div class="tasks-list">
                    ${tasksList}
                </div>
            </div>`;
        }
    }
    renderBadge(){
        let newTasksBadge = this.element.querySelector(".new-tasks-badge");
        if(newTasksBadge){
            newTasksBadge.remove();
        }
        if(this.newTasksCount > 0){
            let newTasksBadge = `<div class="new-tasks-badge">${this.newTasksCount}</div>`;
            this.element.insertAdjacentHTML("afterbegin", newTasksBadge);
        }
    }
    afterRender(){
        this.renderBadge();
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
    showTasksMenu(tasksButton){
        let tasksMenu = this.element.querySelector(".tasks-list-container");
        tasksMenu.style.display = "flex";
        this.newTasksCount = 0;
        this.renderBadge();
        let controller = new AbortController();
        document.addEventListener("click", this.removeTasksMenu.bind(this, controller, tasksButton), {signal: controller.signal});
        tasksButton.removeAttribute("data-local-action");
    }
    removeTasksMenu(controller, tasksButton, event){
        let menu = event.target.closest(".tasks-list-container");
        if(!menu){
            let tasksMenu = this.element.querySelector(".tasks-list-container");
            tasksMenu.style.display = "none";
            controller.abort();
            tasksButton.setAttribute("data-local-action", "showTasksMenu");
        }
    }
}
