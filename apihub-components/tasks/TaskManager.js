const Task = require('./Task');
const enclave = require("opendsu").loadAPI("enclave");
const fsPromises = require('fs').promises;
const space = require('../spaces-storage/space');
const constants = require('./constants');
const STATUS = constants.STATUS;
const EVENTS = constants.EVENTS;

class TaskManager {
    constructor() {
        if (TaskManager.instance) {
            return TaskManager.instance;
        }
        TaskManager.instance = this;
        this.tasks = [];
        this.tasksTable = "tasks";
        this.queue = [];
        this.logQueues = {};
        this.maxRunningTasks = 9;
        this.locks = new Map();
    }

    getTaskLogFilePath(spaceId) {
        return space.APIs.getTaskLogFilePath(spaceId);
    }

    async storeTaskLog(spaceId, taskId, logData) {
        const generateLogMessage = (taskId, logData) => {
            const {time, logType, message, data = {}} = logData
            return `${time}:Task ${taskId}---${logType}---${message}${Object.keys(data).length > 0 ? '---' + JSON.stringify(data) : ''}\n`
        }

        const acquireLock = async (filePath) => {
            while (this.locks.get(filePath)) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            this.locks.set(filePath, true);
        }

        const releaseLock = (filePath) => {
            this.locks.set(filePath, false);
        }

        const taskLogFile = await space.APIs.getTaskLogFilePath(spaceId, taskId);

        await acquireLock(taskLogFile);

        try {
            const logMessage = generateLogMessage(taskId, logData);
            await fsPromises.appendFile(taskLogFile, logMessage);
        } finally {
            releaseLock(taskLogFile);
        }
    }

    async initialize() {
        let spaceMapPath = space.APIs.getSpaceMapPath();
        let spacesMap = JSON.parse(await fsPromises.readFile(spaceMapPath, 'utf-8'));
        for (let spaceId in spacesMap) {
            let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
            let records = await $$.promisify(lightDBEnclaveClient.getAllRecords)($$.SYSTEM_IDENTIFIER, this.tasksTable);
            for (let record of records) {
                let task = record.data;
                if (task.status === STATUS.COMPLETED) {
                    await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, this.tasksTable, task.id);
                    continue;
                }
                // TODO: this assumes that all task classes are in the same folder
                let taskClass = require(`./${task.name}`);
                let taskInstance = new taskClass(task.spaceId, task.userId, task.configs);
                taskInstance.id = task.id; //set the original id
                taskInstance.setStatus(task.status) //set the original status
                if (taskInstance.status === STATUS.FAILED) {
                    taskInstance.failMessage = task.failMessage;
                }
                if (taskInstance.status === STATUS.RUNNING || taskInstance.status === STATUS.PENDING) {
                    taskInstance.setStatus(STATUS.CANCELLED);
                }
                this.tasks.push(taskInstance);
                this.setUpdateDBHandler(lightDBEnclaveClient, taskInstance);
            }
        }
    }

    setUpdateDBHandler(lightDBEnclaveClient, task) {
        const processLogQueue = async (spaceId, taskId) => {
            const {queue} = this.logQueues[taskId]
            this.logQueues[taskId].processing = true
            while (queue.length) {
                let logData = queue.shift()
                await this.storeTaskLog(spaceId, taskId, logData)
            }
            this.logQueues[taskId].processing = false
        }

        task.on(EVENTS.UPDATE, async () => {
            await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, this.tasksTable, task.id, {data: task.serialize()})
        })

        task.on(EVENTS.LOG, (spaceId, logData) => {
            if (!this.logQueues[task.id]) {
                this.logQueues[task.id] = {queue: [], processing: false}
            }
            this.logQueues[task.id].queue.push(logData)
            if (!this.logQueues[task.id].processing) {
                processLogQueue(spaceId, task.id)
            }
        })
    }


    async addTask(task) {
        if (!(task instanceof Task)) {
            throw new Error('object provided is not an instance of Task');
        }
        this.tasks.push(task);
        let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(task.spaceId);
        await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, this.tasksTable, task.id, {data: task.serialize()});
        this.setUpdateDBHandler(lightDBEnclaveClient, task);
    }

    async getTaskLogs(spaceId, taskId) {
        let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
        let taskLogs = [];
        try {
            let taskRecordLogs = await $$.promisify(lightDBEnclaveClient.getRecord)($$.SYSTEM_IDENTIFIER, this.tasksTable, `${taskId}_logs`)
            if (taskRecordLogs) {
                taskLogs = taskRecordLogs.data
            }
        } catch (error) {
            error.statusCode = 404;
            throw error;
        }
        return taskLogs;
    }

    cancelTask(taskId) {
        let task = this.tasks.find(task => task.id === taskId);
        if (!task) {
            throw new Error('Task not found');
        }
        task.cancel();
    }

    async cancelTaskAndRemove(taskId) {
        let task = this.tasks.find(task => task.id === taskId);
        if (!task) {
            throw new Error('Task not found');
        }
        if (task.status === STATUS.RUNNING) {
            task.cancel();
        }
        await this.removeTask(taskId);
    }

    async removeTask(taskId) {
        let task = this.tasks.find(task => task.id === taskId);
        if (!task) {
            throw new Error('Task not found');
        }
        let spaceId = task.spaceId;
        if (task.deleteTimeout) {
            clearTimeout(task.deleteTimeout);
        }
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

    serializeTasks(spaceId) {
        return this.tasks.filter(task => task.spaceId === spaceId).map(task => task.serialize());
    }

    getRunningTasks() {
        return this.tasks.filter(task => task.status === STATUS.RUNNING);
    }

    runTask(taskId) {
        let runningTasks = this.getRunningTasks();
        let task = this.tasks.find(task => task.id === taskId);
        if (!task) {
            throw new Error('Task not found');
        }
        if (runningTasks.length >= this.maxRunningTasks) {
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
        if (this.queue.length > 0 && this.getRunningTasks().length < this.maxRunningTasks) {
            let nextTask = this.queue.shift();
            this.setQueueCallbacks(nextTask);
            nextTask.run();
        }
    }
}

const taskManager = new TaskManager();
(async () => {
    await taskManager.initialize();
})();

module.exports = taskManager;
