const fsPromises = require('fs').promises;
const path = require('path');
const volumeManager = require('../volumeManager.js');
const IFlow = require('./IFlow.js');

async function getSpaceFlows(spaceId) {
    const flowsPath = path.join(volumeManager.paths.space, `${spaceId}/flows`);
    const files = await fsPromises.readdir(flowsPath);
    const flows = {};
    for (const file of files) {
        const flowName = file.replace('.js', '');
        flows[flowName] = path.join(flowsPath, file);
    }
    return flows;
}

async function addFlow(spaceId, flowData) {
    const flows = await getSpaceFlows(spaceId);
    if (flows[flowData.name]) {
        const error = new Error("Flow already exists");
        error.statusCode = 429;
        throw error;
    }

    const flowPath = path.join(volumeManager.paths.space, `${spaceId}/flows/${flowData.name}.js`);
    const flowContent = generateFlowContent(flowData);

    await fsPromises.writeFile(flowPath, flowContent);
    return {
        success: true,
        message: "Flow added successfully"
    };
}

function generateFlowContent(flowData) {
    const IFlowString = IFlow.toString();
    return `
${IFlowString}

class ${flowData.name} extends IFlow {
    static flowMetadata = {
        action: "${flowData.action}",
        intent: "${flowData.intent}",
    };

    static flowParametersSchema = ${JSON.stringify(flowData.flowParametersSchema, null, 4)};

    constructor() {
        super(${flowData.name});
    }

    async userCode(apis, parameters) {
        ${flowData.code}
    }

    async execute(parameters) {
        return new Promise(async (resolve, reject) => {
            const apis = {
                success: (data) => this.resolve({ resolve }, data),
                fail: (error) => this.reject({ reject }, error),
                loadModule: (moduleName) => this.loadModule(moduleName, this.__securityContext)
            };
            try {
                this.validateParameters(parameters);
                await this.userCode(apis, parameters);
            } catch (error) {
                this.genericReject(reject, error);
            }
        });
    }
}

module.exports = ${flowData.name};
`;
}

module.exports = {
    APIs: {
        addFlow
    }
}
