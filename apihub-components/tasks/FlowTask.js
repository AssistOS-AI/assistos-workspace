const Task = require('./Task.js');
const path = require('path');
const fsPromises = require('fs').promises;

const getFlow = async (spaceId,applicationId, flowName) => {
    const flowPath = await getFlowPath(spaceId,applicationId, flowName);
    return require(flowPath);
}

const getFlowPath = async (spaceId,applicationId, flowName) => {
    const initialPath = path.join(dataVolumePaths.space, `${spaceId}/applications/${applicationId}/flows`);
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
    constructor(securityContext, spaceId, userId,applicationId,configs, flowId) {
        super(spaceId, userId);
        return (async () => {
            this.configs = configs;
            this.flowId = flowId;
            this.flow = new (await getFlow(spaceId, applicationId,this.flowId))
            this.flow.__securityContext = securityContext;
            this.getFlow = getFlow;
            return this;
        })();
    }

    async runTask() {
        this.flow.loadModule = this.loadModule;
        return await this.flow.execute(this);
    }

    async cancelTask() {

    }

    serialize() {
    }
}

module.exports = FlowTask
