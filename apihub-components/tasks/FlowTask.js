const Task = require('./Task.js');
const path = require('path');
const fsPromises = require('fs').promises;
const {paths: dataVolumePaths} = require('../volumeManager');

const getFlow = async (spaceId, flowName) => {
    const flowPath = await getFlowPath(spaceId, flowName);
    return require(flowPath);
}

const getFlowPath = async (spaceId, flowName) => {
    const initialPath = path.join(dataVolumePaths.space, `${spaceId}/flows`);
    const files = await fsPromises.readdir(initialPath);
    const flowFile = files.find(file => file === `${flowName}.js`);
    if (flowFile) {
        return path.join(initialPath, flowFile);
    }
    const applicationsPath = path.join(dataVolumePaths.space, `${spaceId}/applications`);
    const applications = await fsPromises.readdir(applicationsPath);
    for (const application of applications) {
        const applicationFlowsPath = path.join(applicationsPath, application, 'flows');
        const files = await fsPromises.readdir(applicationFlowsPath);
        const flowFile = files.find(file => file === `${flowName}.js`);
        if (flowFile) {
            return path.join(applicationFlowsPath, flowFile);
        }
    }
    throw new Error('Flow not found');
}

class FlowTask extends Task {
    constructor(securityContext, spaceId, userId, configs, flowId) {
        super(securityContext, spaceId, userId);
        return (async () => {
            this.configs = configs;
            this.flowId = flowId;
            this.flow = new (await getFlow(spaceId, this.flowId))
            this.flow.__securityContext = securityContext;
            this.getFlow = getFlow;
            return this;
        })();
    }

    async runTask() {
        return await this.flow.execute(this);
    }

    async cancelTask() {

    }

    serialize() {
    }
}

module.exports = FlowTask
