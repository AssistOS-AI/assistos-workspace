const IImageLLM=require("../../../interfaces/IImageLLM.js");

class DALLE2 extends IImageLLM{
    static modelName="dall-e-2";
    constructor(APIKey,config) {
        super(APIKey,config);
    }
    getModelName(){
        return DALLE2.modelName;
    }
}
module.exports=DALLE2;