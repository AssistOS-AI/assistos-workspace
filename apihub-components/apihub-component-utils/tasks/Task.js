const crypto = require('../crypto');
const STATUS = {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};
class Task {
    constructor(securityContext) {
        this.status = STATUS.PENDING;
        this.id = crypto.generateId(16);
        this.securityContext = securityContext;
        // possible statuses: pending, running, completed, failed, cancelled
    }
    async run(){
        if (this.status !== STATUS.PENDING) {
            throw new Error(`Cannot run task in status ${this.status}`);
        }
        this.status = STATUS.RUNNING;
        if(!this.runTask){
            throw new Error('executeTask method must be implemented');
        }
        try{
            let result = await this.runTask();
            this.status = STATUS.COMPLETED;
            this.emit(STATUS.COMPLETED);
            return result;
        } catch (e) {
            this.status = STATUS.FAILED;
            throw e;
        }
    }
    async cancel(){
        if (this.status === STATUS.RUNNING) {
            this.status = STATUS.CANCELLED;
            if(this.cancelTask){
               await this.cancelTask();
            } else {
                throw new Error('cancelTask method must be implemented');
            }
        } else {
            throw new Error(`Cannot cancel task in status ${this.status}`);
        }
    }
    on(event, callback) {
        if (event === STATUS.COMPLETED && this.status === STATUS.COMPLETED) {
            callback();
        } else {
            this.completeCallback = callback;
        }
    }

    emit(event) {
        if (event === STATUS.COMPLETED && this.completeCallback) {
            this.completeCallback();
        }
    }

}
module.exports = Task;