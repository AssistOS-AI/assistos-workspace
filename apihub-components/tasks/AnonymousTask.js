const { exec } = require("child_process");
const Task = require("./Task");
class AnonymousTask extends Task {
    constructor(executeFn) {
        super();
        this.executeFn = executeFn;
    }

    async runTask() {
        return await this.executeFn();
    }

    runCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(stderr || error.message);
                    return;
                }
                resolve(stdout || stderr);
            });
        });
    }
}
module.exports = AnonymousTask;
