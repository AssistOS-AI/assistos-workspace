const agentModule = assistOS.loadModule("agent");
const llmModule = assistOS.loadModule("llm");
const constants = require("assistos").constants;

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
        this.agent = await agentModule.getAgent(this.spaceId,this.agentId);
        this.agentName = this.agent.name;
        const llms = await llmModule.getModels({spaceId: this.spaceId});
        //this.llmTabs = this.getLlmTabsHtml(llms);
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
