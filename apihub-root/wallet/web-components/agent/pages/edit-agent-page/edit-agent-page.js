const agentModule = assistOS.loadModule("agent");
const llmModule = assistOS.loadModule("llm");
const constants = require("assistos").constants;
import {generateId} from "../../../../imports.js"
export class EditAgentPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let urlParts = window.location.hash.split("/");
        this.spaceId = assistOS.space.id;
        this.agentId = urlParts[urlParts.length - 1];
        if (!this.currentTab) {
            this.currentTab = "agent-description";
        }
        this.invalidate(async ()=>{
            this.agent = await agentModule.getAgent(this.spaceId,this.agentId);
            this.initialAgent = this.agent;
        });
    }

    async beforeRender() {
        debugger
        this.agent = await agentModule.getAgent(this.spaceId,this.agentId);
        this.agentName = this.agent.name;
        const llms = await llmModule.getModels({spaceId: this.spaceId});
        this.llmTabs = this.getLlmTabsHtml(llms);
        this.deleteAgentButton = `
        <div class="delete-agent" data-local-action="deleteAgent">
            <img src="./wallet/assets/icons/trash-can.svg" alt="Delete agent" class="delete-icon">
            <div>Delete agent</div>
        </div>`;
        if (this.agent.name === constants.DEFAULT_AGENT_NAME) {
            this.deleteAgentButton = "";
        }
    }

    getLlmTabsHtml(llms) {
        const llmsByType = {}
        llms.forEach(llm => {
            if (!llmsByType[llm.type]) {
                llmsByType[llm.type] = [];
            }
            llmsByType[llm.type].push(llm);
        })
        let llmTabsHtml = "";
        Object.keys(llmsByType).forEach(llmType => {
            llmTabsHtml +=  `<div class="tab" data-local-action="openTab agent-${llmType}">${llmType.slice(0,1).toLocaleUpperCase()+llmType.slice(1)}</div>`
        });
        return llmTabsHtml;
    }

    async afterRender() {
        let currentTab = this.element.querySelector(`[data-local-action="openTab ${this.currentTab}"]`);
        currentTab.classList.add("active");
        this.checkSaveButtonState();
    }

    async deleteAgent() {
        let message = "Are you sure you want to delete this agent?";
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
        if (!confirmation) {
            return;
        }
        await agentModule.deleteAgent(assistOS.space.id, this.agent.id);
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
    generateLlmSelectHtml(llmModels, llmType) {
        return `<div class="form-item">
            <label class="form-label" for="${llmType}LLM">${llmType} LLM</label>
            <select class="form-input" name="${llmType}LLM" id="${llmType}LLM">
                ${this.constructLlmOptions(llmModels, llmType)}
            </select>
        </div>`
    }
    constructLlmOptions(llmModels, llmType) {
        const options = [];
        const selectedLlm = this.agent.llms[llmType];

        if (selectedLlm) {
            // Selected option
            const uniqueId = generateId(8);
            options.push(`<option value="${uniqueId}" data-model="${selectedLlm.modelName}" data-provider="${selectedLlm.providerName}" selected>
                            ${selectedLlm.modelName} ${selectedLlm.providerName}
                        </option>`);
        } else {
            // Placeholder option
            options.push(`<option value="" disabled selected hidden>Select ${llmType} Model</option>`);
        }

        // Other LLM options
        llmModels.forEach(llm => {
            const isSelected = selectedLlm &&
                llm.modelName === selectedLlm.modelName &&
                llm.providerName === selectedLlm.providerName;
            if (!isSelected) {
                const uniqueId = generateId(8);
                options.push(
                    `<option value="${uniqueId}" data-model="${llm.modelName}" data-provider="${llm.providerName}">
                    ${llm.modelName} ${llm.providerName}
                </option>`);
            }
        });
        return options.join('');
    }
    async saveChanges(_target) {
        await agentModule.updateAgent(assistOS.space.id, this.agent.id, this.agent);
        this.initialAgent = JSON.parse(JSON.stringify(this.agent));
        this.checkSaveButtonState();
        if (this.agent.name === assistOS.agent.name) {
            await assistOS.changeAgent(this.agent.id);
            document.querySelector('chat-page').webSkelPresenter.invalidate();
        }
        await assistOS.showToast("Agent updated", "success");
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/agents-page`);
    }

    checkSaveButtonState() {
        let saveButton = this.element.querySelector(".save-button");
        if (JSON.stringify(this.initialAgent) === JSON.stringify(this.agent)) {
            saveButton.classList.add("disabled");
        } else {
            saveButton.classList.remove("disabled");
        }
    }

    async navigateToAgentsPage(){
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/agents-page`);
    }
}