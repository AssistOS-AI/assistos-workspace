const IImageLLM=require("../../../interfaces/IImageLLM.js");

class DALLE2 extends IImageLLM{
    static modelName="dall-e-2";
    constructor(config, apiKey) {
        super();
        this.config = config;
        this.apiKey = apiKey;
    }
    getModelName(){
        return DALLE2.modelName;
    }
}
module.exports=DALLE2;