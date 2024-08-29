const crypto = require('../apihub-component-utils/crypto');
const constants = require('./constants');
const eventPublisher = require("../subscribers/eventPublisher");
const STATUS = constants.STATUS;
const EVENTS = constants.EVENTS;
class Task {
    constructor(securityContext, spaceId, userId) {
        this.status = STATUS.CREATED;
        this.id = crypto.generateId(16);
        this.securityContext = securityContext;
        this.userId = userId;
        this.spaceId = spaceId;
        // possible statuses: pending, running, completed, failed, cancelled
    }
    async run(){
        if (this.status === STATUS.RUNNING) {
            throw new Error(`Cannot run task in status ${this.status}`);
        }
        this.setStatus(STATUS.RUNNING);
        if(!this.runTask){
            throw new Error('executeTask method must be implemented');
        }
        try{
            let result = await this.runTask();
            this.setStatus(STATUS.COMPLETED);
            this.emit(STATUS.COMPLETED);
            return result;
        } catch (e) {
            this.setStatus(STATUS.FAILED);
            throw e;
        }
    }
    async cancel(){
        if (this.status === STATUS.RUNNING) {
            this.setStatus(STATUS.CANCELLED);
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
    setStatus(status){
        this.status = status;
        this.emit(status); //update queue
        this.emit(EVENTS.UPDATE); //update database
        eventPublisher.notifyClientTask(this.userId, this.id, this.status);
    }
}
module.exports = Task;