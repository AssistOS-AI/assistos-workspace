const Task = require('./Task.js');

class FlowTask extends Task {
    constructor(securityContext, spaceId, userId, configs, flowId) {
        super(securityContext, spaceId, userId);
        return (async () => {
            this.configs = configs;
            this.flowId = flowId;
            const flowModule = require('assistos').loadModule('flow', this.securityContext);
            const FlowClass = await flowModule.getFlow(this.flowId);
            this.flow = new FlowClass();
            return this;
        })();
    }

    async runTask() {
        await this.flow.execute(this);
    }

    async cancelTask() {
        await this.rollback();
    }

    async rollback() {
        try {

        } catch (e) {

        }
    }

    serialize() {
    }
}

module.exports = FlowTask
