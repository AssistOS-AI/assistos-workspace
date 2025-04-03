const agentModule = require("assistos").loadModule("agent", {});
const spaceModule = require("assistos").loadModule("space", {});
const constants = require("assistos").constants;

export class EditAgentPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let urlParts = window.location.hash.split("/");
        this.refreshAgent = async () => {
            this.agent = await agentModule.getAgent(assistOS.space.id, urlParts[3]);
        }
        this.currentTab = urlParts[4];
        if(!this.currentTab){
            this.currentTab = "agent-description";
        }
        this.invalidate(async () => {
            await this.refreshAgent();
            this.initialAgent = JSON.parse(JSON.stringify(this.agent));
            this.agentName = this.agent.name;
            this.boundOnAgentUpdate = this.onAgentUpdate.bind(this);
            await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, this.agent.id, this.boundOnAgentUpdate);
        });
    }

    async onAgentUpdate(type) {
        if (type === "delete") {
            await this.openAgentsPage();
            alert("The agent has been deleted");
        } else {
            this.invalidate(this.refreshAgent);
        }
    }

    async beforeRender() {
        this.deleteAgentButton=`<div class="delete-agent" data-local-action="deleteAgent">Delete agent</div>`;
        if (this.agent.name === constants.DEFAULT_AGENT_NAME) {
            this.deleteAgentButton="";
        }
    }

    async afterRender() {
        let currentTab = this.element.querySelector(`[data-local-action="openTab ${this.currentTab}"]`);
        currentTab.classList.add("selected");
        this.checkSaveButtonState();
    }
    constructLlmOptions(llmModels, llmType) {
        let options = [];
        if (this.agent.llms[llmType]) {
            options.push(`<option value="${this.agent.llms[llmType]}" selected>${this.agent.llms[llmType]}</option>`);
        } else {
            options.push(`<option value="" disabled selected hidden>Select ${llmType} Model</option>`);
        }
        llmModels.forEach(llm => {
            if(this.agent.llms[llmType] !== llm) {
                options.push(`<option value="${llm}">${llm}</option>`);
            }
        });
        return options.join('');
    };
    generateLlmSelectHtml(llmModels, llmType) {
        return `<div class="form-item">
            <label class="form-label" for="${llmType}LLM">${llmType} LLM</label>
            <select class="form-input" name="${llmType}LLM" id="${llmType}LLM">
                ${this.constructLlmOptions(llmModels, llmType)}
            </select>
        </div>`
    }
    async deleteAgent() {
        let message = "Are you sure you want to delete this agent?";
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
        if (!confirmation) {
            return;
        }
        await agentModule.deleteAgent(assistOS.space.id, this.agent.id);
        // if(this.agent.id === assistOS.agent.agentData.id){
        //     if(localStorage.getItem("agent") === this.agent.id) {
        //         localStorage.removeItem("agent");
        //     }
        //     await assistOS.changeAgent();
        //     document.querySelector('chat-container').webSkelPresenter.invalidate();
        // }
        await this.openAgentsPage();
    }

    async openAgentsPage() {
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/agents-page`);
    }

    async exportAgent(_target) {
        try {
            const spaceId = assistOS.space.id;
            const agentId = this.agent.id;

            const blob = await agentModule.exportAgent(spaceId, agentId);
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${this.agent.name}.agent`;

            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            alert("Exporting agent failed");
        }
    }
    async openTab(targetElement, tabName) {
        this.currentTab = tabName;
        this.invalidate();
    }
    uploadImage(){
        return new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.onload = async (e) => {
                const uint8Array = new Uint8Array(e.target.result);
                try {
                    this.agent.imageId = await spaceModule.putImage(uint8Array);
                } catch (e) {
                    reject(e.message);
                }
                resolve();
            };
            reader.onerror = (e) => {
                reject(e.message);
            };
            reader.readAsArrayBuffer(this.photoAsFile);
        });
    }
    async saveChanges(_target) {
        //assistOS.agent.agentData.selectedChat = this.agent.selectedChat
        //hardcoded dependency due to no state binding
        if (this.photoAsFile) {
            await this.uploadImage();
        }
        await agentModule.updateAgent(assistOS.space.id, this.agent.id, this.agent);
        this.initialAgent = JSON.parse(JSON.stringify(this.agent));
        this.checkSaveButtonState();
        if(this.agent.name === assistOS.agent.agentData.name){
            await assistOS.changeAgent(this.agent.id);
            document.querySelector('chat-page').webSkelPresenter.invalidate();
        }
        await assistOS.showToast("Agent updated","success");
    }

    checkSaveButtonState(){
        let saveButton = this.element.querySelector(".save-button");
        if(JSON.stringify(this.initialAgent) === JSON.stringify(this.agent) && !this.photoAsFile){
            saveButton.classList.add("disabled");
        } else {
            saveButton.classList.remove("disabled");
        }
    }
}
