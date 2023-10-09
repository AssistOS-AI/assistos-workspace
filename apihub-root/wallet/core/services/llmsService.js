export class LlmsService {
    constructor() {
    }

    async generateResponse(prompt){
        let result = await fetch("llms/generate",
            {
                method: "PUT",
                body: prompt,
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            });
        return await result.text();
    }
    /*scriptId, scriptParams */
    async callScript(...args){
        let script =webSkel.space.getScript(args[0]);
        const scriptCode = eval(script.content);
        let response="";

        try{
            args.shift();
            response = await scriptCode(args);
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