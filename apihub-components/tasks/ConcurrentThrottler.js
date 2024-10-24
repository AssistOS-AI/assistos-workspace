const constants = require('./constants');
const STATUS = constants.STATUS;
const TaskManager = require('./TaskManager');
class ConcurrentThrottler {
    constructor(maxConcurrent) {
        this.maxConcurrent = maxConcurrent;
        this.queue = [];
    }

    runTask(taskId) {
        let runningTasks = TaskManager.getRunningTasks();
        let task = TaskManager.tasks.find(task => task.id === taskId);
        if (!task) {
            throw new Error('Task not found');
        }
        if (runningTasks.length >= this.maxConcurrent) {
            this.queue.push(task);
            task.setStatus(STATUS.PENDING);
        } else {
            this.setQueueCallbacks(task);
            task.run();
        }
    }

    setQueueCallbacks(task) {
        task.on(STATUS.COMPLETED, () => {
            this.queue = this.queue.filter(t => t.id !== task.id);
            this.runNextTask();
        });
        task.on(STATUS.FAILED, () => {
            this.queue = this.queue.filter(t => t.id !== task.id);
            this.runNextTask();
        });
        task.on(STATUS.CANCELLED, () => {
            this.queue = this.queue.filter(t => t.id !== task.id);
            this.runNextTask();
        });
    }

    runNextTask() {
        if (this.queue.length > 0 && TaskManager.getRunningTasks().length < this.maxConcurrent) {
            let nextTask = this.queue.shift();
            this.setQueueCallbacks(nextTask);
            nextTask.run();
        }
    }
}
const instance = new ConcurrentThrottler(3);
module.exports = instance;
