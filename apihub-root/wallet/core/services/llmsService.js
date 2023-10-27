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
    /*scriptId, scriptParams */
    async callScript(...args){
        let script =webSkel.space.getScript(args[0]);
        let scriptCode = eval(script.content);
        args.shift();
        webSkel.getService("FlowsService").registerFlow(script.name, scriptCode);
        let response="";
        try{
            response = await webSkel.getService("FlowsService").runFlow(script.name, ...args);
        }catch (e){
            await showApplicationError("Script execution Error", `Encountered an error while attempting to execute the script ${script.name}`, e);
        }
        try{
            let responseJson = JSON.parse(response);
            return {responseString:null,responseJson:responseJson};
        }catch(e){
            return {responseString:response,responseJson:null};
        }
    }
}