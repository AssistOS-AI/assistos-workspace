import * as dependencies from "../../imports.js";
import {FlowApis} from "../models/FlowApis.js";

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
    async callFlow(...args){
        let flow = system.space.getFlow(args[0]);
        let usedDependencies = [];
        if(flow.class.dependencies){
            for(let functionName of flow.class.dependencies){
                usedDependencies.push(dependencies[functionName]);
            }
        }
        let flowInstance = new flow.class(...usedDependencies);

        const apis = Object.getOwnPropertyNames(FlowApis.prototype)
            .filter(method => method !== 'constructor');
        apis.forEach(methodName => {
            flowInstance[methodName] = FlowApis.prototype[methodName].bind(flowInstance);
        });

        args.shift();
        if(flowInstance.start === undefined){
            let message = `Flow ${flow.class.name} must have a function named 'start'`;
            await showApplicationError(message, message, message);
        } else {
            let response;
            try {
                response = await flowInstance.run(...args);
            }catch (e) {
                return await showApplicationError("Flow execution Error", `Encountered an error while attempting to execute the flow ${flow.class.name}`, e);
            }
            if(!response){
                return await showApplicationError("Flow execution Error", `flow ${flow.class.name} must have a return value!`,`flow ${flow.class.name} must have a return value!`);
            }
            try{
                let responseJson = JSON.parse(response);
                return {responseString:null,responseJson:responseJson};
            }catch(e){
                return {responseString:response,responseJson:null};
            }
        }
    }
}