const WebAssistant = assistOS.loadModule("webassistant", {});

export class ApplicationCreatorScripts {
    constructor(element, invalidate, props) {
        this.element = element;
        this.props = props;
        this.invalidate = invalidate;
        this.pageName ="Scripts"
        this.invalidate();
    }

    async beforeRender() {
        this.processes = await WebAssistant.getScripts(assistOS.space.id);
        this.processRows = this.processes.map(process => `
            <tr>
                <td class="main-cell">
                    <span style="font-weight: 500;">${process.name}</span>
                </td>
                <td style="max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${process.description}
                </td>
                <td class="actions-button">
                    <button class="table-action-btn" data-local-action="editProcess ${process.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                    </button>
                    <button class="delete-row-btn" data-local-action="deleteProcess ${process.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async afterRender() {

    }
    async openAddProcessModal() {
        const result = await assistOS.UI.showModal("add-edit-process-modal",
            {webassistant:true}, true);
        if (result.addedProcess) {
            this.invalidate();
        }
    }

    async editProcess(event, processId) {
        const result = await assistOS.UI.showModal("add-edit-process-modal", {
            processid: processId,
            webassistant:true
        }, true);
        if (result.changedProcess || result.addedProcess) {
            this.invalidate();
        }
    }

    async deleteProcess(event, processId) {
        const result = await assistOS.UI.showModal("delete-process-modal", {
            processid: processId,
            webassistant:true
        }, true);
        if (result.deletedProcess) {
            this.invalidate();
        }
    }
}