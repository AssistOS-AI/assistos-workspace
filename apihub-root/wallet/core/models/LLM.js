export class LLM {

    constructor(llmData){
        this.id = llmData.id;
        this.name = llmData.name;
        this.__think = "Thinking...";
        this.__body = {
            intelligence:3,
            creativity:3,
            cost:3,
            variants:1,
            messages: []
        };
    }
    addSystemMessage(message){
        this.__body.messages.push({role:"system", content: message});
    }
    setResponseFormat(format){
        //must be text or json_object for now
        this.__body.responseFormat = format;
    }
    setIntelligenceLevel(level){
        this.__body.intelligence = level;
    }
    setCreativityLevel(level){
        this.__body.creativity = level;
    }
    async summarize(prompt, max_tokens){
        this.__body.prompt = prompt;
        this.__body.max_tokens = max_tokens;
        return await assistOS.services.generateResponse(JSON.stringify(this.__body));
    }
    async chatbot(prompt, max_tokens, messages){
        //messages: array of these {"role": "user", content:"text"}
        this.__body.messages = messages;
        this.__body.prompt = prompt;
        this.__body.max_tokens = max_tokens;
        return await this.callLLM();
    }
    async request(prompt, max_tokens){
        //this.setThink(prompt);
        this.__body.prompt = prompt;
        this.__body.max_tokens = max_tokens;
        return await this.callLLM();
    }
    async brainstorm (prompt, number, max_tokens){
        this.setThink(prompt);
        this.__body.prompt = prompt;
        this.__body.variants = number;
        this.__body.max_tokens = max_tokens;
        return await this.callLLM();
    }
    async setCostLevel(level){
        this.__body.cost = level;
    }
    async proofread(prompt){
        this.setThink(prompt);
        this.__body.prompt = prompt;
        return await this.callLLM();
    }
    setThink(prompt){
        this.__think = prompt;
    }
    async callLLM() {
        await assistOS.services.displayThink(this.__think);
        let result = await this.generateResponse(JSON.stringify(this.__body), assistOS.space.id);
        assistOS.services.closeThink();

        // await new Promise(async (resolve) => {
        //     setTimeout(async () => {
        //         let dateObj = new Date();
        //         let date = dateObj.toJSON().slice(0, 10);
        //         let time = dateObj.toJSON().slice(11, 16);
        //         await assistOS.callFlow("AddTask", {
        //             taskDescription: this.__body.prompt,
        //             date: date + " " + time
        //         });
        //         resolve();
        //     }, 0);
        // });

        return result;
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
                await assistOS.UI.showModal("add-apikey-modal");
                return;
            }else{
                await showApplicationError("LLM call failed", `An error occurred on the server side`, err.message + " " + err.stack);
                return;
            }
        }
        return await result.text();
    }
}