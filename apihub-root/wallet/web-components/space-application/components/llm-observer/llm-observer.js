export class LLMObserver {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.boundOnLog = this.onLog.bind(this);
        this.logBuffer = [];
        this.debouncedProcessLogBuffer = debounce(this.processLogBuffer.bind(this), 200);
        this.observingMode = null;
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
            await assistOS.NotificationRouter.unsubscribeFromObject(`${assistOS.space.id}/logs/DEBUG`);
        }
        await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, "logs/INFO", this.boundOnLog);
        this.observingMode = 'info';
    }

    async observeDebugLogs() {
        if (this.observingMode === 'info') {
            await assistOS.NotificationRouter.unsubscribeFromObject(`${assistOS.space.id}/logs/DEBUG`);
        }
        await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, "logs/INFO", this.boundOnLog);
        this.observingMode = 'debug';
    }

    async processLog(logData) {
        this.addLogEntry(logData);
    }

    addLogEntry(logData) {
        if (logData.message) {
            this.logBuffer.push(logData);
            this.debouncedProcessLogBuffer();
        }
    }
    async openDocument(documentId) {
        await assistOS.UI.changeToDynamicPage(
            'space-application-page',
            `${assistOS.space.id}/Space/document-view-page/${documentId}`
        );

    }
    processLogBuffer() {
        if (this.logBuffer.length === 0) return;

        const fragment = document.createDocumentFragment();

        this.logBuffer.forEach(logData => {
            const { type, message, data, time } = logData;
            const logEntry = document.createElement('log-entry');
            logEntry.setAttribute('data-presenter', 'log-entry');
            logEntry.type= type;
            logEntry.message=message;
            logEntry.time=time;
            logEntry.dataSet={};
            if (data) {
                Object.keys(data).forEach(key => {
                    logEntry.dataSet[key] = data[key];
                });
            }
            fragment.appendChild(logEntry);
            if (data?.documentId) {
                debugger
                this.openDocument(data.documentId);
            }
        });

        this.logBox.appendChild(fragment);
        this.logBuffer = [];

        const maxLogs = 150;
        while (this.logBox.children.length > maxLogs) {
            this.logBox.removeChild(this.logBox.firstChild);
        }
    }
}

function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}
