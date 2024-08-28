const Task = require('./Task');
const enclave = require("opendsu").loadAPI("enclave");
const fsPromises = require('fs').promises;
const space = require('../../spaces-storage/space');
class TaskManager {
    constructor() {
        this.tasks = [];
        this.tasksTable = "tasks";
        this.queue = [];
        this.maxRunningTasks = 10;
    }
    async initialize() {
        let spaceMapPath = space.APIs.getSpaceMapPath();
        let spacesMap =  JSON.parse(await fsPromises.readFile(spaceMapPath, 'utf-8'));
        for(let spaceId in spacesMap){
            let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
            let records = await $$.promisify(lightDBEnclaveClient.getAllRecords)($$.SYSTEM_IDENTIFIER, this.tasksTable);
            for(let record of records){
                let task = record.data;
                if(task.status === "pending"){
                    let taskInstance = new [task.name](task.configs);
                    this.tasks.push(taskInstance);
                }
            }
        }
    }
    async addTask(task, spaceId) {
        if (!(task instanceof Task)) {
            throw new Error('object provided is not an instance of Task');
        }
        task.spaceId = spaceId;
        this.tasks.push(task);
        let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
        await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, this.tasksTable, task.id, {data: task.serialize()});
    }

    cancelTaskAndRemove(taskId) {
        let task = this.tasks.find(task => task.id === taskId);
        if (!task) {
            throw new Error('Task not found');
        }
        task.cancel();
        this.tasks = this.tasks.filter(task => task.id !== taskId);
    }
    async removeTask(taskId) {
        let task = this.tasks.find(task => task.id === taskId);
        if(!task){
            throw new Error('Task not found');
        }
        let spaceId = task.spaceId;
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
        await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, this.tasksTable, taskId);
    }
    getTask(taskId) {
        let task = this.tasks.find(task => task.id === taskId);
        if (!task) {
            throw new Error('Task not found');
        }
        return task;
    }
    getRunningTasks() {
        return this.tasks.filter(task => task.status === 'running');
    }
    runTask(taskId) {
        let runningTasks = this.getRunningTasks();

        let task = this.tasks.find(task => task.id === taskId);
        if (!task) {
            throw new Error('Task not found');
        }
        if (runningTasks.length >= this.maxRunningTasks) {
            this.queue.push(task);
            return "Task added to queue";
        } else {
            task.on('completed', () => {
                this.runNextTask();
            });
            task.run();
        }

    }

    runNextTask() {
        if (this.queue.length > 0 && this.getRunningTasks().length < this.maxRunningTasks) {
            let nextTask = this.queue.shift();
            nextTask.on('completed', () => {
                this.runNextTask();
            });
            nextTask.run();
        }
    }
}

const taskManager = new TaskManager();
(async ()=>{
    await taskManager.initialize();
})();
module.exports = taskManager;