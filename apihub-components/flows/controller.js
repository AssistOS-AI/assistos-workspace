const fsPromises = require('fs').promises;
const utils = require('../apihub-component-utils/utils.js');
const constants = require("assistos").constants;
const path = require('path');
const {subscribersModule} = require("../subscribers/controller.js");
const dataVolumePaths = require('../volumeManager').paths;

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

async function loadFlows(request, response) {
    const filePath = path.join(dataVolumePaths.space, `${request.params.spaceId}/flows`);
    try {
        let flows = await loadJSFiles(filePath);
        return utils.sendResponse(response, 200, "application/javascript", flows);
    } catch (e) {
        return utils.sendResponse(response, 500, "application/javascript", e);
    }
}

async function getFlow(request, response) {
    const spaceId = request.params.spaceId;
    const flowName = request.params.flowName;
    try {
        let filePath = path.join(dataVolumePaths.space, `${spaceId}/flows/${flowName}.js`);
        let flow = await fsPromises.readFile(filePath, {encoding: 'utf8'});
        return utils.sendResponse(response, 200, "application/javascript", flow);
    } catch (error) {
        return utils.sendResponse(response, 500, "application/javascript", error);
    }

}

async function addFlow(request, response) {
    const spaceId = request.params.spaceId;
    const flowData = request.body;
    const flowName = request.params.flowName;
    try {
        let filePath = path.join(dataVolumePaths.space, `${spaceId}/flows/${flowName}.js`);
        await fsPromises.writeFile(filePath, flowData, 'utf8');
        subscribersModule.notifySubscribers(spaceId, request.userId, flowName, flowName);
        subscribersModule.notifySubscribers(spaceId, request.userId, "flows", "flows");
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            message: `Flow ${flowData.name} added successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
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
            success: true,
            message: `Flow ${flowName} updated successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
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
            success: true,
            message: `Flow ${flowName} deleted successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
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
    try {
        let personality;
        if(personalityId){
            personality = await personalityModule.getPersonality(spaceId, personalityId);
        } else {
            personality = await personalityModule.getPersonality(spaceId, constants.PERSONALITIES.DEFAULT_PERSONALITY_ID);
        }
        const flowPath = path.join(dataVolumePaths.space, `${spaceId}/flows/${flowName}.js`);
        //const flowClass = await import(flowPath);
        //let flowInstance = new flowClass[Object.keys(flowClass)[0]]();
        const flowClass = require(flowPath);
        let flowInstance = new flowClass();
        if (flowInstance.start === undefined) {
            return utils.sendResponse(response, 500, "application/json", {
                success: false,
                message: `Flow ${flowInstance.constructor.name} must have a function named 'start'`
            });
        }
        const apis = Object.getOwnPropertyNames(flowModule.IFlow.prototype)
            .filter(method => method !== 'constructor');
        apis.forEach(methodName => {
            flowInstance[methodName] = flowModule.IFlow.prototype[methodName].bind(flowInstance);
        });
        if (flowClass.inputSchema) {
            // assistOS.services.validateSchema(context, flow.inputSchema, "input");
        }

        let response;
        try {
            response = await ((context, personality) => {
                let returnPromise = new Promise((resolve, reject) => {
                    flowInstance.resolve = resolve;
                    flowInstance.reject = reject;
                });
                flowInstance.personality = personality;
                flowInstance.__securityContext = securityContext;
                flowInstance.start(context, personality);
                return returnPromise;
            })(context, personality);
        } catch (e) {
            console.error(e);
            return await showApplicationError("Flow execution Error", `Error executing flow ${flowObj.flowInstance.constructor.name}`, e);
        }
        if (flowClass.outputSchema) {
            if (typeof flowClass.outputSchema.isValid === "undefined") {
                try {
                    let parsedResponse = JSON.parse(response);
                    //assistOS.services.validateSchema(parsedResponse, flowObj.flowClass.outputSchema, "output");
                    return parsedResponse;
                } catch (e) {
                    console.error(e);
                    return await showApplicationError(e, e, e.stack);
                }
            }
        }
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            message: `Flow ${flowName} called successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at calling flow: ${flowName}`
        });
    }

}
module.exports = {
    loadFlows,
    getFlow,
    addFlow,
    updateFlow,
    deleteFlow,
    callFlow
}