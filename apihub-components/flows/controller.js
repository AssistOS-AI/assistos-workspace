const fsPromises = require('fs').promises;
const utils = require('../apihub-component-utils/utils.js');
const constants = require("assistos").constants;
const path = require('path');
const {subscribersModule} = require("../subscribers/controller.js");
const dataVolumePaths = require('../volumeManager').paths;
const flows = require('./flows.js');
const CustomError = require('../apihub-component-utils/CustomError.js');
async function loadJSFiles(filePath) {
    let localData = "";
    const files = await fsPromises.readdir(filePath);

    const statPromises = files.map(async (file) => {
        const fullPath = path.join(filePath, file);
        const stat = await fsPromises.stat(fullPath);
        if (file.toLowerCase() !== ".git" && !file.toLowerCase().includes("license")) {
            return {file, stat};
        }
    });

    let fileStats = (await Promise.all(statPromises)).filter(stat => stat !== undefined);

    fileStats.sort((a, b) => a.stat.ctimeMs - b.stat.ctimeMs);

    for (const {file} of fileStats) {
        let fullPath = path.join(filePath, file);
        const module = require(fullPath);
        localData += "export " + module.toString() + '\n';
        //localData += await fsPromises.readFile(path.join(filePath, file), 'utf8') + '\n';
    }
    return localData;
}


async function listFlows(request, response) {
    try {
        const spaceId = request.params.spaceId;
        const flowNames = await getSpaceFlowNames(spaceId);
        return utils.sendResponse(response, 200, "application/json",
            {
                data: JSON.stringify(flowNames),
            });
    } catch (e) {
        return utils.sendResponse(response, 500, "application/json", e);
    }
}

async function getSpaceFlowNames(spaceId) {
    const filePath = path.join(dataVolumePaths.space, `${spaceId}/flows`);
    const files = await fsPromises.readdir(filePath);
    const flows = [];
    for (const file of files) {
        const flowName = file.replace('.js', '');
        flows.push(flowName);
    }
    return flows;

}

async function getFlow(request, response) {
    async function findFlowFilePath(spaceId, flowName) {
        let filePath = path.join(dataVolumePaths.space, `${spaceId}/flows/${flowName}.js`);
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

    const spaceId = request.params.spaceId;
    const flowName = request.params.flowName;
    try {
        const flowFilePath = await findFlowFilePath(spaceId, flowName);
        let flow = await transformCommonJSToES6(flowFilePath);
        return utils.sendResponse(response, 200, "application/javascript", flow);
    } catch (error) {
        return utils.sendResponse(response, error.statusCode||500, "application/javascript", error.message);
    }
}


async function addFlow(request, response) {
    const spaceId = request.params.spaceId;
    const flowData = request.body;
    try {
        await flows.APIs.addFlow(spaceId, flowData);
        return utils.sendResponse(response, 200, "application/json", {
            message: `Flow ${flowData.name} added successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            message: error + ` Error at adding flow: ${flowData.name}`
        });
    }
}

async function updateFlow(request, response) {
    const spaceId = request.params.spaceId;
    const flowName = request.params.flowName;
    const flowData = request.body;
    try {
        let filePath = path.join(dataVolumePaths.space, `${spaceId}/flows/${flowName}.js`);
        await fsPromises.writeFile(filePath, flowData, 'utf8');
        subscribersModule.notifySubscribers(spaceId, request.userId, flowName, flowName);
        subscribersModule.notifySubscribers(spaceId, request.userId, "flows", "flows");
        return utils.sendResponse(response, 200, "application/json", {
            message: `Flow ${flowName} updated successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            message: error + ` Error at updating flow: ${flowName}`
        });
    }
}

async function deleteFlow(request, response) {
    const spaceId = request.params.spaceId;
    const flowName = request.params.flowName;
    try {
        let filePath = path.join(dataVolumePaths.space, `${spaceId}/flows/${flowName}.js`);
        await fsPromises.unlink(filePath);
        subscribersModule.notifySubscribers(spaceId, request.userId, "flows", "flows");
        subscribersModule.notifySubscribers(spaceId, request.userId, flowName, flowName);
        return utils.sendResponse(response, 200, "application/json", {
            message: `Flow ${flowName} deleted successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            message: error + ` Error at deleting flow: ${flowName}`
        });
    }
}

async function callFlow(request, response) {
    const spaceId = request.params.spaceId;
    const flowName = request.params.flowName;
    const context = request.body.context;
    const personalityId = request.body.personalityId;
    const SecurityContext = require("assistos").ServerSideSecurityContext;

    let securityContext = new SecurityContext(request);
    const personalityModule = require("assistos").loadModule("personality", securityContext);
    const flowModule = require("assistos").loadModule("flow", securityContext);

    let personality;
    if (personalityId) {
        personality = await personalityModule.getPersonality(spaceId, personalityId);
    } else {
        personality = await personalityModule.getPersonalityByName(spaceId, constants.DEFAULT_PERSONALITY_NAME);
    }
    const flowPath = path.join(dataVolumePaths.space, `${spaceId}/flows/${flowName}.js`);
    let flowClass
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
    return utils.sendResponse(response, 200, "application/json", {
        data: result
    });
}

module.exports = {
    listFlows,
    getFlow,
    addFlow,
    updateFlow,
    deleteFlow,
    callFlow
}
