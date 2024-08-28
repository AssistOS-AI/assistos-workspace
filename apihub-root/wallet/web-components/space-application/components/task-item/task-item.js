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
        let actionButton;
        if(runButtonStatuses.includes(this.status)){
            this.actionButton = `<button class="general-button green-button">Run</button>`;
        }
    }
    async runTask(){
        await utilModule.runTask(this.id);
    }
    async cancelTask(){
        await utilModule.cancelTask(this.id);
    }
}