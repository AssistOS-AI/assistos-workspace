const ITextLLM=require("../../../interfaces/ITextLLM.js");

class GPT4 extends ITextLLM{
    static modelName = "gpt-4";
    constructor(config,apiKey) {
        super()
        this.config = config;
        this.apiKey = apiKey;
    }
    getModelName(){
        return GPT4.modelName;
    }
}
module.exports = GPT4;