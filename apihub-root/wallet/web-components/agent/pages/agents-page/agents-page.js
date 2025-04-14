const spaceModule = require("assistos").loadModule("space", {});
const agentModule = require("assistos").loadModule("agent", {});
export class AgentsPage {
    constructor(element, invalidate) {
        this.modal = "showAddAgentModal";
        this.element = element;
        this.invalidate = invalidate;
        this.refreshAgents = async ()=>{
            this.agents = await agentModule.getAgents(assistOS.space.id);
        }
        assistOS.space.observeChange(assistOS.space.getNotificationId(), invalidate, this.refreshAgents);

        this.id = "agents";
        this.invalidate(async() =>{
            this.agents = await agentModule.getAgents(assistOS.space.id);
            this.boundsOnListUpdate = this.onListUpdate.bind(this);
            await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, this.id, this.boundsOnListUpdate);
        });
    }
    onListUpdate(){
        this.invalidate(this.refreshAgents);
    }
    async beforeRender() {
        this.agentBlocks = "";
        for(let agent of this.agents){
            let imageSrc;
            if(agent.imageId){
                try {
                    imageSrc = await spaceModule.getImageURL(agent.imageId);
                } catch (e) {
                    imageSrc = "./wallet/assets/images/default-agent.png";
                }

            } else {
                imageSrc = "./wallet/assets/images/default-agent.png";
            }
            this.agentBlocks += `<agent-item data-presenter="agent-item" data-name="${agent.name}" data-id="${agent.id}" data-image="${imageSrc}"></agent-item>`;
        }
    }
    setContext(){
        assistOS.context = {
            "location and available actions":"You are in the page Agents. Here you can add, edit or delete agents.",
            "available items": this.agents
        }
    }

    afterRender(){
        this.setContext();
    }
    async showAddAgentModal() {
        const data = await assistOS.UI.showModal("add-agent",true);
        if(data.refresh){
            this.invalidate(this.refreshAgents);
        }
    }

    async selectAgent(_target){
        let agentId = assistOS.UI.reverseQuerySelector(_target, "agent-item").getAttribute("data-id");
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/edit-agent-page/${agentId}`);
    }
    async importDocument(_target){
        const  handleFile= async (file) => {
            const formData= new FormData();
            formData.append("file", file);
           const importResult= await spaceModule.importAgent(assistOS.space.id, formData);
           if(importResult.overriden){
                alert(`The agent ${importResult.name} has been overriden`);
           }
        }
        let fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.agent';
        fileInput.style.display = 'none';
        fileInput.onchange = async (event)=> {
            const file = event.target.files[0];
            if (file) {
                if (file.name.endsWith('.agent')) {
                    await handleFile(file);
                    this.invalidate(this.refreshAgents);
                    document.body.appendChild(fileInput);
                    fileInput.remove();
                } else {
                    alert('Only a .agent files are allowed!');
                }
            }
        };
        fileInput.click();
    }
}