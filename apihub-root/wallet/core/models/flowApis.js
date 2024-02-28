
export class FlowApis{
    constructor() {

    }
    run(...args){
        let returnPromise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
        this.start(...args);
        return returnPromise;
    }
    return(value){
        return this.resolve(value);
    }

    fail(error) {
        if (typeof error === "string"){
            error = new Error(error);
        }
        return this.reject(error);
    }
    setDefaultValues(){
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
        return await webSkel.appServices.generateResponse(JSON.stringify(this.__body));
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
        await webSkel.appServices.displayThink(this.__think);
        let result = await webSkel.appServices.generateResponse(JSON.stringify(this.__body),webSkel.currentUser.space.id);
        webSkel.appServices.closeThink();

        await new Promise(async (resolve) => {
            setTimeout(async () => {
                let dateObj = new Date();
                let date = dateObj.toJSON().slice(0, 10);
                let time = dateObj.toJSON().slice(11, 16);
                let flowId = webSkel.currentUser.space.getFlowIdByName("AddTask");
                await webSkel.appServices.callFlow(flowId, `${this.__body.prompt}`, date + " " + time);
                resolve();
            }, 0);
        });

        return result;
    }

}