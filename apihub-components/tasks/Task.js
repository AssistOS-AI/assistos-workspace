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
        this.callbacks = {};
        // possible statuses: pending, running, completed, failed, cancelled
    }
    async run(){
        if (this.status === STATUS.RUNNING) {
            throw new Error(`Cannot run task in status ${this.status}`);
        }
        if(!this.runTask){
            throw new Error('runTask method must be implemented');
        }
        this.setStatus(STATUS.RUNNING);
        this.failMessage = null;
        try{
            let result = await this.runTask();
            //race condition
            if(this.status === STATUS.CANCELLED){
                return;
            }
            this.setStatus(STATUS.COMPLETED);
            return result;
        } catch (e) {
            this.setStatus(STATUS.FAILED);
            this.failMessage = e.message;
            throw e;
        }
    }

    async cancel(){
        if (this.status !== STATUS.RUNNING) {
            throw new Error(`Cannot cancel task in status ${this.status}`);
        }
        if(!this.cancelTask){
            throw new Error('cancelTask method must be implemented');
        }
        this.setStatus(STATUS.CANCELLED);
        await this.cancelTask();
    }
    on(event, callback) {
        this.callbacks[event] = callback;
    }

    emit(event) {
        if(!this.callbacks[event]){
            return;
        }
        this.callbacks[event]();
    }

    removeListener(event){
        this.callbacks[event] = null;
    }
    setStatus(status){
        this.status = status;
        this.emit(status); //update queue
        this.emit(EVENTS.UPDATE); //update database
        eventPublisher.notifyClientTask(this.userId, this.id, this.status);
    }

}
module.exports = Task;
