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

        this.chats = this.getMockChats();
        this.executionHistory = this.getMockExecutionHistory();
        this.selectedChatId = null;

        this.invalidate(async ()=>{
            this.agent = await agentModule.getAgent(this.spaceId,this.agentId);
            this.initialAgent = this.agent;
        });
    }

    getMockChats() {
        return [
            {
                id: 1,
                name: "Customer Support Chat",
                processId: 1,
                processName: "Car Rental Request",
                lastRun: "2024-01-15 14:30",
                status: "success"
            },
            {
                id: 2,
                name: "Ticket Assistant",
                processId: 2,
                processName: "Ticket Purchase Flow",
                lastRun: "2024-01-15 10:15",
                status: "success"
            },
            {
                id: 3,
                name: "Inventory Helper",
                processId: 3,
                processName: "Inventory Management",
                lastRun: "2024-01-14 16:45",
                status: "failed"
            }
        ];
    }

    getMockExecutionHistory() {
        return [
            {
                chatId: 1,
                chatName: "Customer Support Chat",
                timestamp: "2024-01-15 14:30:22",
                status: "success",
                duration: "2.3s",
                result: "Rental approved for John Doe"
            },
            {
                chatId: 2,
                chatName: "Ticket Assistant",
                timestamp: "2024-01-15 10:15:45",
                status: "success",
                duration: "1.8s",
                result: "Ticket TKT_12345 purchased at Central_Station"
            },
            {
                chatId: 3,
                chatName: "Inventory Helper",
                timestamp: "2024-01-14 16:45:10",
                status: "failed",
                duration: "0.5s",
                result: "Error: Insufficient stock for brake_pad"
            }
        ];
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

    async showAddChatModal() {
        const processes = [
            { id: 1, name: "Car Rental Request" },
            { id: 2, name: "Ticket Purchase Flow" },
            { id: 3, name: "Inventory Management" },
            { id: 4, name: "Multi-Agent Coordination" },
            { id: 5, name: "Agent Knowledge Base Query" },
            { id: 6, name: "Parts Request Workflow" }
        ];

        const result = await assistOS.UI.showModal("add-chat-modal", {
            processes: processes
        }, true);

        if (result) {
            const selectedProcess = processes.find(p => p.id === parseInt(result.processId));
            const newChat = {
                id: Math.max(...this.chats.map(c => c.id)) + 1,
                name: result.chatName,
                processId: result.processId,
                processName: selectedProcess.name,
                lastRun: "Never",
                status: "pending",
                agentId: this.agentId
            };
            this.chats.push(newChat);
            this.invalidate();
        }
    }

    async editChat(event, chatId) {
        const chat = this.chats.find(c => c.id === parseInt(chatId));
        if (!chat) return;

        const processes = [
            { id: 1, name: "Car Rental Request" },
            { id: 2, name: "Ticket Purchase Flow" },
            { id: 3, name: "Inventory Management" },
            { id: 4, name: "Multi-Agent Coordination" },
            { id: 5, name: "Agent Knowledge Base Query" },
            { id: 6, name: "Parts Request Workflow" }
        ];

        const result = await assistOS.UI.showModal("edit-chat-modal", {
            chatName: chat.name,
            processId: chat.processId,
            processes: processes,
            chatId: chat.id
        }, true);

        if (result) {
            const chatIndex = this.chats.findIndex(c => c.id === parseInt(chatId));
            if (chatIndex !== -1) {
                const selectedProcess = processes.find(p => p.id === parseInt(result.processId));
                this.chats[chatIndex] = {
                    ...this.chats[chatIndex],
                    name: result.chatName,
                    processId: result.processId,
                    processName: selectedProcess.name
                };
                this.invalidate();
            }
        }
    }

    async runChat(event, chatId) {
        const chat = this.chats.find(c => c.id === parseInt(chatId));
        if (!chat) return;

        chat.status = "running";
        this.selectedChatId = parseInt(chatId);
        this.invalidate();

        setTimeout(() => {
            const success = Math.random() > 0.3;
            chat.status = success ? "success" : "failed";
            chat.lastRun = new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(',', '');

            this.executionHistory.unshift({
                chatId: chat.id,
                chatName: chat.name,
                timestamp: new Date().toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }).replace(',', ''),
                status: chat.status,
                duration: `${(Math.random() * 3 + 0.5).toFixed(1)}s`,
                result: success ? `Process completed successfully with ${this.agentName}` : `Error: Process failed to execute`
            });

            this.invalidate();
        }, 2000);
    }

    async deleteChat(event, chatId) {
        const chat = this.chats.find(c => c.id === parseInt(chatId));
        if (!chat) return;

        const result = await assistOS.UI.showModal("delete-chat-modal", {
            chatName: chat.name,
            chatId: chat.id
        }, true);

        if (result && result.confirmed) {
            this.chats = this.chats.filter(c => c.id !== parseInt(chatId));
            this.executionHistory = this.executionHistory.filter(h => h.chatId !== parseInt(chatId));
            if (this.selectedChatId === parseInt(chatId)) {
                this.selectedChatId = null;
            }
            this.invalidate();
        }
    }

    getStatusBadgeClass(status) {
        return `status-badge ${status}`;
    }

    formatStatus(status) {
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
}