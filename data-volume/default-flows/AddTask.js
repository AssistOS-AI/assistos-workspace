const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class AddTask extends IFlow {
    static flowMetadata = {
        action: "Adds a task for the agent",
        intent: "Add a new task",
    };

    static flowParametersSchema = {
        description: {
            type: "string",
            required: true
        },
        date: {
            type: "string",
            required: false
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            await assistOS.space.getAgent().addTask(parameters.description, parameters.date);
            apis.success(parameters.description);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = AddTask;
