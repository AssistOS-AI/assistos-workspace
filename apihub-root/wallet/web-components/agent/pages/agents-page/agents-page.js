const spaceModule = require("assistos").loadModule("space", {});
const agentModule = require("assistos").loadModule("agent", {});

export class AgentsPage {
    constructor(element, invalidate) {
        this.modal = "showAddAgentModal";
        this.element = element;
        this.invalidate = invalidate;
        this.spaceId = assistOS.space.id;
        this.invalidate();
    }

    async beforeRender() {
        this.agents = await agentModule.getAgents(this.spaceId);
        this.agentBlocks = "";
        for (let agent of this.agents) {
            let imageSrc;
            if (agent.imageId) {
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


    async afterRender() {

    }

    async showAddAgentModal() {
        const data = await assistOS.UI.showModal("add-agent", true);
        if (data.refresh) {
            this.invalidate();
        }
    }

    async selectAgent(_target) {
        let agentId = assistOS.UI.reverseQuerySelector(_target, "agent-item").getAttribute("data-id");
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/edit-agent-page/${agentId}`);
    }

    async importDocument(_target) {
        const handleFile = async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            const importResult = await spaceModule.importAgent(assistOS.space.id, formData);
            if (importResult.overriden) {
                alert(`The agent ${importResult.name} has been overriden`);
            }
        }
        let fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.agent';
        fileInput.style.display = 'none';
        fileInput.onchange = async (event) => {
            const file = event.target.files[0];
            if (file) {
                if (file.name.endsWith('.agent')) {
                    await handleFile(file);
                    this.invalidate();
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