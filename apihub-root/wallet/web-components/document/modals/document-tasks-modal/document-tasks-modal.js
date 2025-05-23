const documentModule = assistOS.loadModule("document");
const utilModule = assistOS.loadModule("util");
export class DocumentTasksModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.documentId = this.element.getAttribute("data-document-id");
        let documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        this.document = documentPresenter._document;
        this.invalidate(async () => {
            this.boundOnListUpdate = this.onListUpdate.bind(this);
            await assistOS.NotificationRouter.subscribeToDocument(this.documentId, "tasksList", this.boundOnListUpdate);
            this.tasks = await documentModule.getDocumentTasks(assistOS.space.id, this.documentId);
        })
    }
    async onListUpdate(data){
        if(data.action === "add"){
            let task = await utilModule.getTask(data.id);
            this.tasks.push(task);
            this.tasksList.insertAdjacentHTML("beforeend", `<task-item data-id="${task.id}" data-presenter="task-item"></task-item>`);
        } else if(data.action === "remove"){
            this.tasks = this.tasks.filter(task => task.id !== data.id);
            let taskItem = this.element.querySelector(`task-item[data-id="${data.id}"]`);
            taskItem.remove();
        }
    }
    beforeRender(){
        this.modalContent = `<div class="tasks-list no-tasks">No tasks created</div>`;
        let tasksList = "";
        // if(this.document.commands.compileVideo){
        //     tasksList += `<document-command-item data-type="compileVideo" data-presenter="document-command-item"></document-command-item>`;
        // }
        // for(let chapter of this.document.chapters){
        //     if(chapter.commands.compileVideo){
        //         tasksList += `<chapter-command-item data-type="compileVideo" data-chapter-id="${chapter.id}" data-presenter="chapter-command-item"></chapter-command-item>`;
        //     }
        //     for(let paragraph of chapter.paragraphs){
        //         if(paragraph.commands.speech){
        //             tasksList += `<paragraph-command-item data-type="speech" data-paragraph-id="${paragraph.id}" data-chapter-id="${chapter.id}" data-presenter="paragraph-command-item"></paragraph-command-item>`;
        //         }
        //         if(paragraph.commands.lipsync){
        //             tasksList += `<paragraph-command-item data-type="lipsync" data-paragraph-id="${paragraph.id}" data-chapter-id="${chapter.id}" data-presenter="paragraph-command-item"></paragraph-command-item>`;
        //         }
        //         if(paragraph.commands.compileVideo){
        //             tasksList += `<paragraph-command-item data-type="compileVideo" data-paragraph-id="${paragraph.id}" data-chapter-id="${chapter.id}" data-presenter="paragraph-command-item"></paragraph-command-item>`;
        //         }
        //     }
        // }
        for(let task of this.tasks){
            tasksList += `<task-item data-id="${task.id}" data-presenter="task-item"></task-item>`;
        }
        if(tasksList !== ""){
            this.modalContent = `
            <div class="tasks-buttons">
                <button class="general-button run-all-tasks" data-local-action="runAllTasks">Run all</button>
                <button class="general-button cancel-all-tasks" data-local-action="cancelAllTasks">Cancel all</button>
            </div>
            <div class="tasks-header">
                <div class="agent-header">Agent</div>
                <div class="name-header">Name</div>
                <div class="status-header">Status</div>
                <div class="link-header">Object Link</div>
                <div class="action-header">Action</div>
            </div>
            <div class="tasks-list">
                ${tasksList}
            </div>`;
        }
    }

    afterRender(){
        this.checkButtonsState();
        this.tasksList = this.element.querySelector(".tasks-list");
    }
    async runAllTasks(button){
        button.classList.add("disabled");
        await utilModule.runAllDocumentTasks(assistOS.space.id, this.documentId);
    }
    async cancelAllTasks(button){
        button.classList.add("disabled");
        await utilModule.cancelAllDocumentTasks(assistOS.space.id, this.documentId);
    }
    checkButtonsState(){
        let runningTasks = 0;
        let readyToRunTasks = 0;
        for(let task of this.tasks){
            if(task.status === "running"){
                runningTasks++;
            } else if(task.status === "created"){
                readyToRunTasks++;
            }
        }
        if(runningTasks === 0 && readyToRunTasks > 0){
            let runAllButton = this.element.querySelector(".run-all-tasks");
            runAllButton.classList.remove("disabled");
            let cancelAllButton = this.element.querySelector(".cancel-all-tasks");
            cancelAllButton.classList.add("disabled");
        } else if(runningTasks > 0){
            let runAllButton = this.element.querySelector(".run-all-tasks");
            runAllButton.classList.add("disabled");
            let cancelAllButton = this.element.querySelector(".cancel-all-tasks");
            cancelAllButton.classList.remove("disabled");
        }
    }

    closeModal(){
        assistOS.UI.closeModal(this.element);
    }
    updateTaskInList(taskId, status){
        let task = this.tasks.find(t => t.id === taskId);
        task.status = status;
        this.checkButtonsState();
    }
    getTask(taskId){
        return this.tasks.find(t => t.id === taskId);
    }
}
