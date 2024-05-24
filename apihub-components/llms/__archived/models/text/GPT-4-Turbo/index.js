const ITextLLM = require("../../../interfaces/ITextLLM.js");

class GPT4Turbo extends ITextLLM {
    static modelName = "gpt-4-turbo";
    constructor(APIKey,config) {
        super(APIKey,config);
    }

    getModelName() {
        return GPT4Turbo.modelName;
    }

}

module.exports = GPT4Turbo;
