import * as dependencies from "../../imports.js";

export class LlmsService {
    constructor() {
    }

    async generateResponse(body){
        let result = await fetch("llms/generate",
            {
                method: "PUT",
                body: body,
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            });
        if(result.status !==200){
            let err = JSON.parse(await result.text());
            await showApplicationError("LLM call failed", `An error occurred on the server side`, err.message + " " + err.stack);
            return;
        }
        return await result.text();
    }
    /*flowId, flowParams */
    async callFlow(...args){
        let flow = webSkel.currentUser.space.getFlow(args[0]);
        let flowInstance = new flow.class(dependencies);

        const methodEntries = Object.getOwnPropertyNames(Object.getPrototypeOf(flowInstance))
            .filter(property => typeof flowInstance[property] === 'function' && property !== 'constructor')
            .reduce((acc, methodName) => {
                acc[methodName] = flowInstance[methodName];
                return acc;
            }, {});
        for(let entries of Object.entries(flowInstance)){
            if(typeof entries[1] === 'function'){
                methodEntries[entries[0]]=entries[1];
            }
        }
        //let flowCode = eval(flow.content);
        args.shift();
        webSkel.getService("FlowsService").registerFlow(flow.class.name, methodEntries);
        let response="";
        try{
            response = await webSkel.getService("FlowsService").runFlow(flow.class.name, ...args);
        }catch (e){
            await showApplicationError("Flow execution Error", `Encountered an error while attempting to execute the script ${flow.name}`, e);
        }
        try{
            let responseJson = JSON.parse(response);
            return {responseString:null,responseJson:responseJson};
        }catch(e){
            return {responseString:response,responseJson:null};
        }
    }
}