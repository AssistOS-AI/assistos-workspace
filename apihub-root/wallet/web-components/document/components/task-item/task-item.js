const utilModule = require("assistos").loadModule("util", {});
const documentModule = require("assistos").loadModule("document", {});

export class TaskItem{
    constructor(element, invalidate){
        this.element = element;
        this.invalidate = invalidate;
        let id = this.element.getAttribute("data-id");
        let tasksModal = this.element.closest("document-tasks-modal");
        this.tasksModalPresenter = tasksModal.webSkelPresenter;
        this.task = this.tasksModalPresenter.getTask(id);

        this.invalidate(async ()=> {
            this.boundOnTasksUpdate = this.onTasksUpdate.bind(this);
            await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, id, this.boundOnTasksUpdate);
        })
    }
    onTasksUpdate(status){
        this.status = status;
        this.tasksModalPresenter.updateTaskInList(this.task.id, status);
        this.invalidate();
    }
    async beforeRender(){
        this.name = this.task.name;
        this.status = this.task.status;
        this.paragraphItem = document.querySelector(`paragraph-item[data-paragraph-id="${this.task.configs.paragraphId}"]`);
        if(!this.paragraphItem){
            this.paragraphText = "...........";
            if(this.task.configs.personalityId){
                let documentPage = document.querySelector("document-view-page");
                let documentPresenter = documentPage.webSkelPresenter;
                let personalityName = await documentPresenter.getPersonalityName(this.task.configs.personalityId);
                this.agent = personalityName;
                this.personalityImageSrc = await documentPresenter.getPersonalityImageByName(personalityName);
            } else {
                this.agent = "none";
                this.personalityImageSrc = "./wallet/assets/images/default-personality.png";
            }
            return;
        }
        this.paragraphPresenter = this.paragraphItem.webSkelPresenter;
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
        let agentImage = this.element.querySelector(".agent-image");
        agentImage.addEventListener("error", (e)=>{
            e.target.src = "./wallet/assets/images/default-personality.png";
        });
        let taskStatus = this.element.querySelector(".task-status");
        if(this.status === "failed"){
            taskStatus.setAttribute("data-local-action", "showTaskFailInfo");
            taskStatus.classList.add("failed-link");
        }
        if(this.status === "completed"){
            taskStatus.classList.add("green");
        }
        if(!this.paragraphItem){
            let taskLink = this.element.querySelector(".task-link");
            taskLink.style.pointerEvents = "none";
        }
    }

    scrollDocument(){
        let paragraphId = this.paragraphPresenter.paragraph.id;
        let paragraphIndex = this.paragraphPresenter.chapter.getParagraphIndex(paragraphId);
        if (paragraphIndex === this.paragraphPresenter.chapter.paragraphs.length - 1) {
            return this.paragraphItem.scrollIntoView({behavior: "smooth", block: "nearest"});
        }
        this.paragraphItem.scrollIntoView({behavior: "smooth", block: "center"});
    }
    async showTaskFailInfo(){
        let taskInfo = await utilModule.getTaskRelevantInfo(this.task.id);
        let info= "";
        if(typeof taskInfo === "object"){
            for(let [key,value] of Object.entries(taskInfo)){
                info += `${key}: ${value}\n`;
            }
        } else {
            info = taskInfo;
        }
        let taskInfoHTML = `<div class="info-pop-up">${info}</div>`;
        let taskAction = this.element.querySelector(".task-status");
        taskAction.insertAdjacentHTML("beforeend", taskInfoHTML);
        document.addEventListener("click", this.removeInfoPopUp.bind(this), {once: true});
    }
    removeInfoPopUp(){
        let taskInfo = this.element.querySelector(".info-pop-up");
        taskInfo.remove();
    }
    async deleteTask(){
        await utilModule.removeTask(this.task.id);
        if(this.task.configs.sourceCommand){
            delete this.paragraphPresenter.paragraph.commands[this.task.configs.sourceCommand].taskId;
            await documentModule.updateParagraphCommands(assistOS.space.id, this.paragraphPresenter._document.id, this.paragraphPresenter.paragraph.id, this.paragraphPresenter.paragraph.commands);
        }
        this.element.remove();
    }
}