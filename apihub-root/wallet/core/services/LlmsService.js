import * as dependencies from "../../imports.js";
import {IFlow} from "../models/IFlow.js";

export class LlmsService {
    constructor() {
    }

    async generateResponse(body,spaceId){
        let result = await fetch("llms/generate",
            {
                method: "PUT",
                body: body,
                headers: {
                    "Content-type": "application/json; charset=UTF-8",
                    "spaceId":spaceId
                }
            });
        if(result.status !==200){
            let err = JSON.parse(await result.text());
            if(result.status===404){
                    await system.UI.showModal( "add-apikey-modal", {presenter: "add-apikey-modal"});
                    return;
            }else{
            await showApplicationError("LLM call failed", `An error occurred on the server side`, err.message + " " + err.stack);
            return;
            }
        }
        return await result.text();
    }
    /*flowId, flowParams */
    async callFlow(flowId, context, personalityId){
        let flowObj;
        try {
            flowObj = this.initFlow(flowId, context, personalityId);
        }catch (e) {
            console.error(e);
            return await showApplicationError(e, e, e.stack);
        }

        let response;
        try {
            response = await flowObj.flowInstance.run(context, flowObj.personality);
        }catch (e) {
            console.error(e);
            return await showApplicationError("Flow execution Error", `Error executing flow ${flowObj.flowInstance.constructor.name}`, e);
        }
        if(flowObj.flowClass.outputSchema){
            if(typeof flowObj.flowClass.outputSchema.isValid === "undefined"){
                try {
                    let parsedResponse = JSON.parse(response);
                    //system.services.validateSchema(parsedResponse, flowObj.flowClass.outputSchema, "output");
                    return parsedResponse;
                }catch (e) {
                    console.error(e);
                    return await showApplicationError(e, e, e.stack);
                }
            }
        }
        return response;
    }

    initFlow(flowId, context, personalityId){
        let flow = system.space.getFlow(flowId);
        let personality;
        if(personalityId){
            personality = system.space.getPersonality(personalityId);
        } else {
            personality = system.space.getPersonalityByName(dependencies.constants.DEFAULT_PERSONALITY_NAME);
        }
        let usedDependencies = [];
        if(flow.class.dependencies){
            for(let functionName of flow.class.dependencies){
                usedDependencies.push(dependencies[functionName]);
            }
        }
        let flowInstance = new flow.class(...usedDependencies);
        if(flowInstance.start === undefined){
            throw new Error(`Flow ${flowInstance.constructor.name} must have a function named 'start'`);
        }
        const apis = Object.getOwnPropertyNames(IFlow.prototype)
            .filter(method => method !== 'constructor');
        apis.forEach(methodName => {
            flowInstance[methodName] = IFlow.prototype[methodName].bind(flowInstance);
        });
        flowInstance.setDefaultValues();
        if(flow.class.inputSchema){
           // system.services.validateSchema(context, flow.class.inputSchema, "input");
        }
        return {flowInstance:flowInstance, flowClass:flow.class, personality: personality};
    }

}