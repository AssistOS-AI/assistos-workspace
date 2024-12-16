const utilModule = require('assistos').loadModule('util', {});

export class TaskWatcher {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.taskId = this.element.getAttribute('taskId');
        this.boundOnTaskLog = this.onTaskLog.bind(this);
        this.historyLogQueue = [];
        this.invalidate();
        this.monitorPresenter = this.element.closest('notifications-monitor').webSkelPresenter;
    }


    async beforeRender() {

    }

    async afterRender() {
        this.logBox = this.element.querySelector('#logViewerContent');
        this.loadingSpinner = this.element.querySelector('#loadingSpinner');
        this.taskLogs = await utilModule.getTaskLogs(assistOS.space.id, this.taskId);
        await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, this.taskId + "/logs", this.boundOnTaskLog);
        for (let log of this.taskLogs) {
            await this.onTaskLog(log);
        }
        this.renderedLogHistory = true;
    }

    async onTaskLog(logData) {
        if (!this.renderedLogHistory) {
            this.historyLogQueue.push(logData);
        }else{
            if(this.historyLogQueue.length>0){
                while(this.historyLogQueue.length>0){
                    await this.processLog(this.historyLogQueue.shift());
                }
            }
            await this.processLog(logData);
        }
    }

    async processLog(logData){
        const {logType, message, data} = logData;

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
            this.logBox.insertBefore(logEntry, this.loadingSpinner);
            this.logBox.scrollTop = this.logBox.scrollHeight;
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
