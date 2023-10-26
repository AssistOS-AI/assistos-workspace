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
    async callScript(scriptName, scriptCode, args){
        webSkel.getService("FlowsService").registerFlow(scriptName, scriptCode);
        let response="";
        try{
            response = await webSkel.getService("FlowsService").runFlow(scriptName, args);
        }catch (e){
            await showApplicationError("Script execution Error", `Encountered an error while attempting to execute the script ${args[0]}`, e);
        }
        try{
            let responseJson = JSON.parse(response);
            return {responseString:null,responseJson:responseJson};
        }catch(e){
            return {responseString:response,responseJson:null};
        }
    }
}