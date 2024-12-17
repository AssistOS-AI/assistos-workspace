export class LLMObserver {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.boundOnLog = this.onLog.bind(this);
        this.invalidate(async () => {
            if (this.element.getAttribute('observingMode') === 'debug') {
                await this.observeDebugLogs();
            } else {
                await this.observeInfoLogs();
            }
        });
        this.element.classList.add('active');
    }

    async beforeRender() {
    }

    async afterRender() {
        this.logBox = this.element.querySelector('#logViewerContent');
    }

    async onLog(logData) {
        await this.processLog(logData);
    }

    async observeInfoLogs() {
        if (this.observingMode === "debug") {
            await assistOS.NotificationRouter.unsubscribeFromObject(`${assistOS.space.id}/logs/debug`);
        }
        await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, "logs/info", this.boundOnLog);
        this.observingMode = 'info';
    }

    async observeDebugLogs() {
        if (!this.observingMode) {
            await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, "logs/info", this.boundOnLog);
        }
        await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, "logs/debug", this.boundOnLog);
        this.observingMode = 'debug';
    }

    async processLog(logData) {
        const {logType, message, data} = logData;
        this.addLogEntry(message, logType);
    }

    addLogEntry(message, logType) {
        if (message) {
            const logEntry = document.createElement('div');
            logEntry.className = 'logEntry';
            switch (logType) {
                case 'ERROR':
                    logEntry.classList.add('logError');
                    break;
                case 'WARNING':
                    logEntry.classList.add('logWarning');
                    break;
                case 'INFO':
                    logEntry.classList.add('logInfo');
                    break;
                case 'SUCCESS':
                    logEntry.classList.add('logSuccess');
                    break;
                case 'PROGRESS':
                    logEntry.classList.add('logProgress');
                    break;
                default:
                    logEntry.classList.add('logDefault');
                    break;
            }
            logEntry.textContent = message;
            this.logBox.appendChild(logEntry);
        }
    }
}