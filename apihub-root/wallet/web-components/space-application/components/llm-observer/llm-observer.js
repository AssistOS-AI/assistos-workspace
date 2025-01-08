export class LLMObserver {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.boundOnLog = this.onLog.bind(this);
        this.logBuffer = [];
        this.debouncedProcessLogBuffer = debounce(this.processLogBuffer.bind(this), 500);
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

    async beforeRender() {}

    async afterRender() {
        this.logBox = this.element.querySelector('#logViewerContent');

        await assistOS.NotificationRouter.subscribeToSpace(
            assistOS.space.id,
            'logs/INFO',
            this.boundOnLog
        );

        this.scrollToBottom();
    }

    async onLog(logData) {
        this.addLogEntry(logData);
    }

    async observeInfoLogs() {
        if (this.observingMode === 'debug') {
            await assistOS.NotificationRouter.unsubscribeFromObject(`${assistOS.space.id}/logs/DEBUG`);
        }
        await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, 'logs/INFO', this.boundOnLog);
        this.observingMode = 'info';
    }

    async observeDebugLogs() {
        if (this.observingMode === 'info') {
            await assistOS.NotificationRouter.unsubscribeFromObject(`${assistOS.space.id}/logs/INFO`);
        }
        await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, 'logs/DEBUG', this.boundOnLog);
        this.observingMode = 'debug';
    }

    addLogEntry(logData) {
        if (!logData?.message) return;
        this.logBuffer.push(logData);
        this.debouncedProcessLogBuffer();
    }

    async processLogBuffer() {
        if (this.logBuffer.length === 0) return;

        const fragment = document.createDocumentFragment();
        this.logBuffer.forEach(logData => {
            const { type, message, data, time } = logData;
            const logEntry = document.createElement('log-entry');
            logEntry.setAttribute('data-presenter', 'log-entry');
            logEntry.type = type;
            logEntry.message = message;
            logEntry.time = time;
            logEntry.dataSet = {};
            if (data) {
                Object.keys(data).forEach(key => {
                    logEntry.dataSet[key] = data[key];
                });
            }
            fragment.appendChild(logEntry);
        });
        this.logBox.appendChild(fragment);
        this.logBuffer = [];

        const maxLogs = 150;
        while (this.logBox.querySelectorAll('log-entry').length > maxLogs) {
            const firstLogEntry = this.logBox.querySelector('log-entry');
            if (firstLogEntry) {
                this.logBox.removeChild(firstLogEntry);
            }
        }

        this.scrollToBottom();
    }

    scrollToBottom() {
        requestAnimationFrame(() => {
            if (this.logBox) {
                console.log('Scrolling to bottom:', this.logBox.scrollHeight);
                this.logBox.scrollTop = this.logBox.scrollHeight;
            }
        });
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
