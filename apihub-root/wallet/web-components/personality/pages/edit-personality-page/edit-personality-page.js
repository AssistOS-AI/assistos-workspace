const personalityModule = require("assistos").loadModule("personality", {});
const spaceModule = require("assistos").loadModule("space", {});
const constants = require("assistos").constants;

export class EditPersonalityPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let urlParts = window.location.hash.split("/");
        this.refreshPersonality = async () => {
            this.personality = await personalityModule.getPersonality(assistOS.space.id, urlParts[3]);
        }
        this.currentTab = urlParts[4];
        if(!this.currentTab){
            this.currentTab = "personality-description";
        }
        this.invalidate(async () => {
            await this.refreshPersonality();
            this.initialPersonality = JSON.parse(JSON.stringify(this.personality));
            this.personalityName = this.personality.name;
            this.boundOnPersonalityUpdate = this.onPersonalityUpdate.bind(this);
            await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, this.personality.id, this.boundOnPersonalityUpdate);
        });
    }

    async onPersonalityUpdate(type) {
        if (type === "delete") {
            await this.openPersonalitiesPage();
            alert("The personality has been deleted");
        } else {
            this.invalidate(this.refreshPersonality);
        }
    }

    async beforeRender() {
        this.deletePersonalityButton=`<div class="delete-personality" data-local-action="deletePersonality">Delete personality</div>`;
        if (this.personality.name === constants.DEFAULT_PERSONALITY_NAME) {
            this.deletePersonalityButton="";
        }
    }

    async afterRender() {
        let currentTab = this.element.querySelector(`[data-local-action="openTab ${this.currentTab}"]`);
        currentTab.classList.add("selected");
        this.checkSaveButtonState();
    }
    constructLlmOptions(llmModels, llmType) {
        let options = [];
        if (this.personality.llms[llmType]) {
            options.push(`<option value="${this.personality.llms[llmType]}" selected>${this.personality.llms[llmType]}</option>`);
        } else {
            options.push(`<option value="" disabled selected hidden>Select ${llmType} Model</option>`);
        }
        llmModels.forEach(llm => {
            if(this.personality.llms[llmType] !== llm) {
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
    async deletePersonality() {
        let message = "Are you sure you want to delete this personality?";
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
        if (!confirmation) {
            return;
        }
        await personalityModule.deletePersonality(assistOS.space.id, this.personality.id);
        if(this.personality.id === assistOS.agent.agentData.id){
            if(localStorage.getItem("agent") === this.personality.id) {
                localStorage.removeItem("agent");
            }
            await assistOS.changeAgent();
            document.querySelector('agent-page').webSkelPresenter.invalidate();
        }
        await this.openPersonalitiesPage();
    }

    async openPersonalitiesPage() {
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/personalities-page`);
    }

    async exportPersonality(_target) {
        try {
            const spaceId = assistOS.space.id;
            const personalityId = this.personality.id;

            const blob = await personalityModule.exportPersonality(spaceId, personalityId);
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${this.personality.name}.persai`;

            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            alert("Exporting personality failed");
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
                    this.personality.imageId = await spaceModule.putImage(uint8Array);
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
        assistOS.agent.agentData.selectedChat = this.personality.selectedChat
        //hardcoded dependency due to no state binding
        if (this.photoAsFile) {
            await this.uploadImage();
        }
        await personalityModule.updatePersonality(assistOS.space.id, this.personality.id, this.personality);
        this.initialPersonality = JSON.parse(JSON.stringify(this.personality));
        this.checkSaveButtonState();
        if(this.personality.name === assistOS.agent.agentData.name){
            await assistOS.changeAgent(this.personality.id);
            document.querySelector('chat-page').webSkelPresenter.invalidate();
        }
        await assistOS.showToast("Personality updated","success");
    }

    checkSaveButtonState(){
        let saveButton = this.element.querySelector(".save-button");
        if(JSON.stringify(this.initialPersonality) === JSON.stringify(this.personality) && !this.photoAsFile){
            saveButton.classList.add("disabled");
        } else {
            saveButton.classList.remove("disabled");
        }
    }
}
