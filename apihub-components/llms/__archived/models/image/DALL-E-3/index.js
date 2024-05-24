const IImageLLM=require("../../../interfaces/IImageLLM.js");

class DALLE3 extends IImageLLM{
    static modelName="dall-e-3";
    constructor(APIKey,config) {
        super(APIKey,config);
    }
    getModelName(){
        return DALLE3.modelName;
    }
}
module.exports=DALLE3;