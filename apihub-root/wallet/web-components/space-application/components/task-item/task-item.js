const utilModule = require("assistos").loadModule("util", {});
export class TaskItem{
    constructor(element, invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.name = this.element.getAttribute("data-name");
        this.status = this.element.getAttribute("data-status");
        this.id = this.element.getAttribute("data-id");
        this.invalidate(async ()=> {
            await utilModule.subscribeToObject(this.id, async (data) => {
                this.status = data.status;
                this.invalidate();
            });
        })
    }
    beforeRender(){
        let runButtonStatuses = ["created", "cancelled"];
        if(runButtonStatuses.includes(this.status)){
            this.actionButton = `<button class="general-button task-button green" data-local-action="runTask">Run</button>`;
        } else if(this.status === "running"){
            this.actionButton = `<button class="general-button task-button yellow" data-local-action="cancelTask">Cancel</button>`;
        } else if(this.status === "completed"){
            this.actionButton = `<button class="general-button task-button grey" disabled>Completed</button>`;
        } else if(this.status === "failed"){
            this.actionButton = `<button class="general-button task-button red" disabled>Failed</button>`;
        }
    }
    async runTask(){
        await utilModule.runTask(this.id);
    }
    async cancelTask(){
        await utilModule.cancelTask(this.id);
    }
}