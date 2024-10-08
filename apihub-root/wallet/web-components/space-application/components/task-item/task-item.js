const utilModule = require("assistos").loadModule("util", {});
export class TaskItem{
    constructor(element, invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.name = this.element.getAttribute("data-name");
        this.status = this.element.getAttribute("data-status");
        this.id = this.element.getAttribute("data-id");
        this.invalidate(async ()=> {
            await utilModule.subscribeToObject(this.id + "taskList", async (status) => {
                this.status = status;
                this.tasksModalPresenter.updateTaskInList(this.id, status);
                this.invalidate();
            });
        })
    }
    beforeRender(){

    }
    afterRender(){
        let tasksModal = this.element.closest("document-tasks-modal");
        this.tasksModalPresenter = tasksModal.webSkelPresenter;
    }
    afterUnload(){
        utilModule.unsubscribeFromObject(this.id + "taskList");
    }
    async showTaskInfo(){
        let taskInfo = await utilModule.getTaskRelevantInfo(this.id);
        let info= "";
        for(let [key,value] of Object.entries(taskInfo)){
            info += `${key}: ${value}\n`;
        }
        let taskInfoHTML = `<div class="info-pop-up">${info}</div>`;
        let taskAction = this.element.querySelector(".task-action");
        taskAction.insertAdjacentHTML("beforeend", taskInfoHTML);
        document.addEventListener("click", this.removeInfoPopUp.bind(this), {once: true});
    }
    removeInfoPopUp(){
        let taskInfo = this.element.querySelector(".info-pop-up");
        taskInfo.remove();
    }
}