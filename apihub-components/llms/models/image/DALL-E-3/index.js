const IImageLLM=require("../../../interfaces/IImageLLM.js");

class DALLE3 extends IImageLLM{
    static modelName="dall-e-3";
    constructor(config, apiKey) {
        super();
        this.config = config;
        this.apiKey = apiKey;
    }
    getModelName(){
        return DALLE3.modelName;
    }
}
module.exports=DALLE3;