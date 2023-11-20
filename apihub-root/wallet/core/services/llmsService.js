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
        let flow =webSkel.currentUser.space.getFlow(args[0]);
        let flowCode = eval(flow.content);
        args.shift();
        webSkel.getService("FlowsService").registerFlow(flow.name, flowCode);
        let response="";
        try{
            response = await webSkel.getService("FlowsService").runFlow(flow.name, ...args);
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