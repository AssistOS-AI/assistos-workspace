export class LLMObserver {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.boundObserveLlmCalls = this.observeLlmCalls.bind(this);
        this.invalidate(async () => {
            await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, "llms", this.boundObserveLlmCalls);
        });
        this.element.classList.add('active');
    }

    addLogEntry(callData) {
        const logEntry = document.createElement('div');
        logEntry.className = 'logEntry';
        logEntry.textContent = JSON.stringify(callData.prompt);
        this.logBox.appendChild(logEntry);
    }
    observeLlmCalls(callData) {
        this.addLogEntry(callData);
    }

    async beforeRender() {

    }

    async afterRender() {
        this.logBox = this.element.querySelector('#logViewerContent');
    }

}