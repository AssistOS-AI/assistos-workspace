const agentModule = assistOS.loadModule("agent");

export class ChatsPage {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.spaceId = assistOS.space.id;

        this.chats = [];
        this.executionHistory = [];
        this.selectedChatId = null;

        this.invalidate();
    }

    async beforeRender() {
        await this.loadChatsData();

        this.chatRows = this.chats.map(chat => `
            <tr>
                <td class="main-cell">${chat.name}</td>
                <td>${chat.processName}</td>
                <td>${chat.lastRun}</td>
                <td>
                    <span class="${this.getStatusBadgeClass(chat.status)}">
                        ${this.formatStatus(chat.status)}
                    </span>
                </td>
                <td class="actions-button">
                    <button class="table-action-btn" data-local-action="editChat ${chat.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                    </button>
                    <button class="table-action-btn run-btn" data-local-action="runChat ${chat.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                    <button class="delete-row-btn" data-local-action="deleteChat ${chat.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `).join('');

        this.renderExecutionHistory();
    }

    async loadChatsData() {
        const agents = await agentModule.getAgents(this.spaceId);

        this.chats = [
            {
                id: 1,
                name: "Customer Support Chat",
                agentId: agents[0]?.id || "agent1",
                processId: 1,
                processName: "Car Rental Request",
                lastRun: "2024-01-15 14:30",
                status: "success"
            },
            {
                id: 2,
                name: "Ticket Assistant",
                agentId: agents[0]?.id || "agent1",
                processId: 2,
                processName: "Ticket Purchase Flow",
                lastRun: "2024-01-15 10:15",
                status: "success"
            },
            {
                id: 3,
                name: "Inventory Helper",
                agentId: agents[1]?.id || "agent2",
                processId: 3,
                processName: "Inventory Management",
                lastRun: "2024-01-14 16:45",
                status: "failed"
            },
            {
                id: 4,
                name: "Multi-Agent Router",
                agentId: agents[0]?.id || "agent1",
                processId: 4,
                processName: "Multi-Agent Coordination",
                lastRun: "Never",
                status: "pending"
            }
        ];

        this.executionHistory = [
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

    renderExecutionHistory() {
        if (this.selectedChatId) {
            const chatHistory = this.executionHistory.filter(h => h.chatId === this.selectedChatId);
            this.executionHistoryHTML = chatHistory.map(item => `
                <div class="history-item">
                    <div class="history-header">
                        <span class="history-chat-name">${item.chatName}</span>
                        <span class="history-timestamp">${item.timestamp}</span>
                    </div>
                    <div class="history-details">
                        Duration: ${item.duration}
                        <span class="${this.getStatusBadgeClass(item.status)} history-status">
                            ${this.formatStatus(item.status)}
                        </span>
                    </div>
                    <div class="history-details">
                        Result: ${item.result}
                    </div>
                </div>
            `).join('');
            this.historyDisplay = "";
        } else {
            this.executionHistoryHTML = `<div style="text-align: center; color: #666; padding: 40px;">
                Select a chat and click "Run" to see execution history
            </div>`;
            this.historyDisplay = "display: none;";
        }
    }

    async afterRender() {
    }

    async showAddChatModal() {
        const agents = await agentModule.getAgents(this.spaceId);
        const processes = [
            { id: 1, name: "Car Rental Request" },
            { id: 2, name: "Ticket Purchase Flow" },
            { id: 3, name: "Inventory Management" },
            { id: 4, name: "Multi-Agent Coordination" },
            { id: 5, name: "Agent Knowledge Base Query" },
            { id: 6, name: "Parts Request Workflow" }
        ];

        const result = await assistOS.UI.showModal("add-chat-modal-extended", {
            agents: agents,
            processes: processes
        }, true);

        if (result) {
            const selectedAgent = agents.find(a => a.id === result.agentId);
            const selectedProcess = processes.find(p => p.id === parseInt(result.processId));

            const newChat = {
                id: Math.max(...this.chats.map(c => c.id), 0) + 1,
                name: result.chatName,
                agentId: result.agentId,
                processId: result.processId,
                processName: selectedProcess.name,
                lastRun: "Never",
                status: "pending"
            };

            this.chats.push(newChat);
            this.invalidate();
        }
    }

    async editChat(event, chatId) {
        const chat = this.chats.find(c => c.id === parseInt(chatId));
        if (!chat) return;

        const agents = await agentModule.getAgents(this.spaceId);
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
            agentId: chat.agentId,
            processId: chat.processId,
            agents: agents,
            processes: processes,
            chatId: chat.id
        }, true);

        if (result) {
            const chatIndex = this.chats.findIndex(c => c.id === parseInt(chatId));
            if (chatIndex !== -1) {
                const selectedAgent = agents.find(a => a.id === result.agentId);
                const selectedProcess = processes.find(p => p.id === parseInt(result.processId));

                this.chats[chatIndex] = {
                    ...this.chats[chatIndex],
                    name: result.chatName,
                    agentId: result.agentId,
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
                result: success ?
                    `Process completed successfully` :
                    `Error: Process failed to execute`
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