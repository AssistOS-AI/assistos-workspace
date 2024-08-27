const crypto = require('../crypto');
class Task {
    constructor(securityContext) {
        this.status = 'pending';
        this.id = crypto.generateId(16);
        this.securityContext = securityContext;
        // possible statuses: pending, running, completed, failed, cancelled
    }
    async run(){
        if (this.status !== 'pending') {
            throw new Error(`Cannot run task in status ${this.status}`);
        }
        this.status = 'running';
        if(!this.runTask){
            throw new Error('executeTask method must be implemented');
        }
        try{
            let result = await this.runTask();
            this.status = 'completed';
            return result;
        } catch (e) {
            this.status = 'failed';
            throw e;
        }
    }
    async cancel(){
        if (this.status === 'running') {
            this.status = 'cancelled';
            if(this.cancelTask){
               await this.cancelTask();
            } else {
                throw new Error('cancelTask method must be implemented');
            }
        } else {
            throw new Error(`Cannot cancel task in status ${this.status}`);
        }
    }

}
module.exports = Task;