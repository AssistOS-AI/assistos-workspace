const crypto = require('./crypto.js');
const {exec} = require("child_process");
class Task{
    constructor(executeFn) {
        this.executeFn = executeFn.bind(this);
        this.status = 'pending';
        this.id = crypto.generateId(16);
        this.childTasks = [];
        this.processes = [];
        // possible statuses: pending, running, completed, failed, cancelled
    }
    async run(){
        if (this.status !== 'pending') {
            throw new Error(`Cannot run task in status ${this.status}`);
        }
        this.status = 'running';
        //TODO use something else to handle cancel instead of Promise to delete temp directory
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
            for(let process of this.processes){
                process.kill();
            }
            this.status = 'cancelled';
            for(let childTask of this.childTasks){
                childTask.cancel();
            }
            this.reject('Task was cancelled');
            delete this.reject;
        }
    }
    addChildTask(task){
        if (!(task instanceof Task)) {
            throw new Error('object provided is not an instance of Task');
        }
        this.childTasks.push(task);
    }
    runCommand(command) {
        return new Promise( (resolve, reject) => {
            let childProcess = exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stdout || stderr);
            });
            this.processes.push(childProcess);
        });
    }
}
module.exports = Task;