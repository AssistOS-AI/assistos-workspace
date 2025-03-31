const fsPromises = require('fs').promises;
const utils = require('../apihub-component-utils/utils.js');
const constants = require("assistos").constants;
const path = require('path');
const dataVolumePaths = require('../volumeManager').paths;
const CustomError = require('../apihub-component-utils/CustomError.js');
async function listFlows(request, response) {
    try {
        const flowNames = await getSpaceFlowNames();
        return utils.sendResponse(response, 200, "text/plain", JSON.stringify(flowNames));
    } catch (e) {
        return utils.sendResponse(response, 500, "application/json", e);
    }
}

async function getSpaceFlowNames() {
    const dirPath = path.join(dataVolumePaths.defaultFlows);
    const files = await fsPromises.readdir(dirPath);
    const flows = [];
    for (const file of files) {
        const flowName = file.replace('.js', '');
        flows.push(flowName);
    }
    return flows;

}
async function findFlowFilePath(spaceId, flowName) {
    let filePath = path.join(dataVolumePaths.defaultFlows, `${flowName}.js`);
    try {
        await fsPromises.access(filePath);
        return filePath;
    } catch (error) {
        const applicationsFolder = path.join(dataVolumePaths.space, `${spaceId}/applications`);
        const applications = await fsPromises.readdir(applicationsFolder);
        for (const application of applications) {
            const applicationFlowsFolder = path.join(applicationsFolder, application, "flows");
            try {
                await fsPromises.access(applicationFlowsFolder);
                const files = await fsPromises.readdir(applicationFlowsFolder);
                for (const file of files) {
                    if (file === `${flowName}.js`) {
                        return path.join(applicationFlowsFolder, file);
                    }
                }
            } catch (error) {

            }
        }
    }
    CustomError.throwNotFoundError(`Flow not found: ${flowName}`, "Flow is not part of the space or any application in the space");
}
async function transformCommonJSToES6(filePath) {
    let content = await fsPromises.readFile(filePath, 'utf8');
    content = content.replace(/const\s+(\w+)\s*=\s*require\(['"](.+?)['"]\);/g, 'import $1 from \'$2\';');
    content = content.replace(/module\.exports\s*=\s*(\w+);/, 'export default $1;');
    return content;
}
async function getFlow(request, response) {
    const flowName = request.params.flowName;
    const spaceId = request.params.spaceId;
    try {
        const flowFilePath = await findFlowFilePath(spaceId, flowName);
        let flow = await transformCommonJSToES6(flowFilePath);
        return utils.sendResponse(response, 200, "application/javascript", flow);
    } catch (error) {
        return utils.sendResponse(response, error.statusCode||500, "application/javascript", error.message);
    }
}

async function callFlow(request, response) {
    const spaceId = request.params.spaceId;
    const flowName = request.params.flowName;
    const context = request.body.context;
    const personalityId = request.body.personalityId;
    const SecurityContext = require("assistos").ServerSideSecurityContext;

    let securityContext = new SecurityContext(request);
    const personalityModule = require("assistos").loadModule("agent", securityContext);
    const flowModule = require("assistos").loadModule("flow", securityContext);

    let personality;
    if (personalityId) {
        personality = await personalityModule.getPersonality(spaceId, personalityId);
    } else {
        personality = await personalityModule.getAgent(spaceId, constants.DEFAULT_PERSONALITY_NAME);
    }
    const flowPath = path.join(dataVolumePaths.defaultFlows, `${flowName}.js`);
    let flowClass;
    try {
        flowClass = require(flowPath);
    } catch (error) {
        return utils.sendResponse(response, 404, "application/json", {
            message: error + `Flow not found: ${flowName}`
        })
    }

    let flowInstance = new flowClass();
    const apis = Object.getOwnPropertyNames(flowModule.IFlow.prototype)
        .filter(method => method !== 'constructor');
    apis.forEach(methodName => {
        flowInstance[methodName] = flowModule.IFlow.prototype[methodName].bind(flowInstance);
    });
    flowInstance.personality = personality;
    flowInstance.__securityContext = securityContext;
    let result;
    try {
        result = await flowInstance.execute(context);
    } catch (error) {
        return utils.sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Flow execution error: ${error.message}`
        });
    }
    return utils.sendResponse(response, 200, "application/json", result);
}

module.exports = {
    listFlows,
    getFlow,
    callFlow
}
