const utilModule = require('assistos').loadModule('util', {});

export class TaskWatcher {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.taskId = this.element.getAttribute('taskId');
        this.boundOnTaskLog = this.onTaskLog.bind(this);
        this.historyLogQueue = [];
        this.logBuffer = [];
        this.debouncedProcessLogBuffer =debounce(this.processLogBuffer.bind(this), 200);
        this.renderedLogHistory = false;
        this.monitorPresenter = this.element.closest('notifications-monitor').webSkelPresenter;
        this.invalidate();
    }

    async beforeRender() {
    }

    async afterRender() {
        this.logBox = this.element.querySelector('#logViewerContent');
        this.loadingSpinner = this.element.querySelector('#loadingSpinner');
        await assistOS.NotificationRouter.subscribeToSpace(
            assistOS.space.id,
            `${this.taskId}/logs`,
            this.boundOnTaskLog
        );
        this.renderedLogHistory = true;

        if (this.historyLogQueue.length > 0) {
            await this.processLogs(this.historyLogQueue);
            this.historyLogQueue = [];
        }
    }

    async onTaskLog(logData) {
        if (!this.renderedLogHistory) {
            this.historyLogQueue.push(logData);
        } else {
            this.logBuffer.push(logData);
            this.debouncedProcessLogBuffer();
        }
    }

    async processLogs(logs) {
        for (const log of logs) {
            await this.processLog(log);
        }
    }

    processLogBuffer() {
        if (this.logBuffer.length === 0) return;

        const fragment = document.createDocumentFragment();

        this.logBuffer.forEach(logData => {
            const { logType, message, data, time } = logData;
            const logEntry = document.createElement('log-entry');
            logEntry.setAttribute('data-presenter', 'log-entry');
            logEntry.logType= logType;
            logEntry.message=message;
            logEntry.time=time;
            logEntry.dataSet={};
            if (data) {
                Object.keys(data).forEach(key => {
                    logEntry.dataSet[key] = data[key];
                });
            }
            fragment.appendChild(logEntry);
        });

        this.logBox.insertBefore(fragment, this.loadingSpinner);
        this.logBuffer = [];

        const maxLogs = 150;
        while (this.logBox.children.length > maxLogs) {
            this.logBox.removeChild(this.logBox.firstChild);
        }
    }

    async processLog(logData) {
        const { data } = logData;

        if (data?.finished) {
            if (this.loadingSpinner) {
                this.loadingSpinner.style.display = 'none';
            }
        }
        if (data?.documentId) {
            await this.openDocument(data.documentId);
        }
        if (data?.taskId) {
            this.monitorPresenter.addTaskWatcher(data.taskId);
        }
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

    async closeWatcher() {
        await assistOS.NotificationRouter.unsubscribeFromObject(`${assistOS.space.id}/${this.taskId}/logs`);
        this.element.remove();
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
