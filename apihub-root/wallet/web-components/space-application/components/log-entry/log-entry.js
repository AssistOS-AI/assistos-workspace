export class LogEntry {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.logType = this.element.logType;
        this.logMessage = this.element.message;
        this.data = this.element.dataSet;
        this.time = this.element.time;
        this.agent = this.element.agent||"System"
        this.invalidate();

    }

    async beforeRender() {
        this.data = Object.entries(this.data).map(([key, value]) => {
            return `<span>${key}:${value} </span>`
        }).join("");
        switch (this.logType ) {
            case 'ERROR':
                this.element .classList.add('logError');
                break;
            case 'WARNING':
                this.element .classList.add('logWarning');
                break;
            case 'INFO':
                this.element .classList.add('logInfo');
                break;
            case 'SUCCESS':
                this.element .classList.add('logSuccess');
                break;
            case 'PROGRESS':
                this.element .classList.add('logProgress');
                break;
            default:
                this.element .classList.add('logDefault');
                break;
        }
    }

    async afterRender() {

    }

    async copyMessage() {
        try {
            await navigator.clipboard.writeText(this.logMessage);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    }

}