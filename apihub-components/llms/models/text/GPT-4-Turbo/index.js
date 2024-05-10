const ITextLLM = require("../../../interfaces/ITextLLM.js");

class GPT4Turbo extends ITextLLM {
    static modelName = "gpt-4-turbo";
    constructor(config, apiKey) {
        super();
        this.config = config;
        this.apiKey = apiKey;
    }

    getModelName() {
        return GPT4Turbo.modelName;
    }

}

module.exports = GPT4Turbo;
