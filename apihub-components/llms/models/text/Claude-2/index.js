const ITextLLM=require("../../../interfaces/ITextLLM.js");

class Claude2 extends ITextLLM{
    static modelName="claude-2.1";
    constructor(config, apiKey) {
        super();
        this.config = config;
        this.apiKey = apiKey;
    }
    getModelName(){
        return Claude2.modelName;
    }
}
module.exports=Claude2;