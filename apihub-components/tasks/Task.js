const crypto = require('../apihub-component-utils/crypto');
const constants = require('./constants');
const SubscriptionManager = require("../subscribers/SubscriptionManager");
const STATUS = constants.STATUS;
const EVENTS = constants.EVENTS;
const deleteTaskOnCompleteDuration = 60000 * 5; //5 minutes
const cookie = require('../apihub-component-utils/cookie.js');
const secrets = require("../apihub-component-utils/secrets");
class Task {
    constructor(spaceId, userId) {
        this.status = STATUS.CREATED;
        this.id = crypto.generateId(16);
        this.userId = userId;
        this.spaceId = spaceId;
        this.callbacks = {};
        // possible statuses: pending, running, completed, failed, cancelled
    }
    async loadModule(moduleName){
        if(!this.securityContext){
            let authSecret = await secrets.getApiHubAuthSecret();
            let securityContextConfig = {
                headers:{
                    cookie: cookie.createApiHubAuthCookies(authSecret, this.userId, this.spaceId)
                }
            }
            const SecurityContext = require('assistos').ServerSideSecurityContext;
            this.securityContext = new SecurityContext(securityContextConfig);
        }
        const module = require('assistos').loadModule(moduleName, this.securityContext);
        return module;
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
            setTimeout(() => {
                const TaskManager = require('./TaskManager');
                TaskManager.removeTask(this.id);
            }, deleteTaskOnCompleteDuration);
            return result;
        } catch (e) {
            this.failMessage = e.message;
            this.setStatus(STATUS.FAILED);
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
        let objectId = SubscriptionManager.getObjectId(this.spaceId, this.id);
        SubscriptionManager.notifyClients("", objectId, this.status);
        let sideBarObjectId = SubscriptionManager.getObjectId(this.spaceId, "sidebar-tasks");
        SubscriptionManager.notifyClients("", sideBarObjectId, {name: this.constructor.name, status: this.status});
    }

}
module.exports = Task;
