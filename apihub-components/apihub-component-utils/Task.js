class Task{
    constructor(executeFn) {
        this.executeFn = executeFn;
        this.status = 'pending';
        // possible statuses: pending, running, completed, failed, cancelled
    }
    run(){
        if (this.status !== 'pending') {
            throw new Error(`Cannot run task in status ${this.status}`);
        }
        this.status = 'running';
        return new Promise((resolve, reject) => {
            this.reject = reject;
            this.executeFn()
                .then((result) => {
                    this.status = 'completed';
                    resolve(result);
                })
                .catch(err => {
                    this.status = 'failed';
                    reject(err);
                });
        });
    }
    cancel(){
        if (this.status === 'running') {
            this.status = 'cancelled';
            this.reject(new Error('Task was cancelled'));
            delete this.reject;
        }
    }
}
module.exports = Task;