const ITextLLM = require("../../../interfaces/ITextLLM.js");

class GPT3_5 extends ITextLLM {
    static modelName = "gpt-3.5-turbo";
    constructor(APIKey,config) {
        super(APIKey,config);
    }

    getModelName() {
        return GPT3_5.modelName;
    }

}

module.exports = GPT3_5;
