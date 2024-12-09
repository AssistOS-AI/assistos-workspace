import {NotificationRouter} from '../../../../../wallet/imports.js';

export class TaskWatcher {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.taskId = this.element.getAttribute('taskId');
        this.boundOnTaskLog = this.onTaskLog.bind(this);
        this.invalidate(async () => {
            await NotificationRouter.subscribeToSpace(assistOS.space.id, this.taskId, this.boundOnTaskLog);
        });
    }

    async onTaskLog(logData) {
        const {logType, message, data} = logData;

        if (data?.finished) {
            if (this.loadingSpinner) {
                this.loadingSpinner.style.display = 'none';
            }
        }

        if (data?.documentId) {
            await this.openDocument(data.documentId);
        }

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


    async beforeRender() {
    }

    async afterRender() {
        this.logBox = this.element.querySelector('#logViewerContent');
        this.loadingSpinner = this.element.querySelector('#loadingSpinner');
    }

    async openDocument(documentId) {
        await assistOS.UI.changeToDynamicPage(
            'space-application-page',
            `${assistOS.space.id}/Space/document-view-page/${documentId}`
        );
    }

    async closeWatcher() {
        this.element.remove();
    }
}
