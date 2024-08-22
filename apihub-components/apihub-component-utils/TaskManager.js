const Task = require('./Task');

class TaskManager {
    constructor() {
        this.tasks = [];
    }

    addTask(task) {
        if (!(task instanceof Task)) {
            throw new Error('object provided is not an instance of Task');
        }
        this.tasks.push(task);
    }

    cancelTaskAndRemove(taskId) {
        let task = this.tasks.find(task => task.id === taskId);
        if (!task) {
            throw new Error('Task not found');
        }
        task.cancel();
        this.tasks = this.tasks.filter(task => task.id !== taskId);
    }
    removeTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
    }
    getTask(taskId) {
        let task = this.tasks.find(task => task.id === taskId);
        if (!task) {
            throw new Error('Task not found');
        }
        return task;
    }
    clearTasks() {
        this.tasks = [];
    }

    getTasks() {
        return this.tasks;
    }
}

const taskManager = new TaskManager();
module.exports = taskManager;