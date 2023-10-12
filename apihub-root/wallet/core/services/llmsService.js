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
        return await result.text();
    }
    /*scriptId, scriptParams */
    async callScript(...args){
        let script =webSkel.space.getScript(args[0]);
        let scriptCode = eval(script.content);
        webSkel.getService("FlowsService").registerFlow(script.name, scriptCode);
        let response="";

        try{
            response = await webSkel.getService("FlowsService").runFlow(script.name);
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