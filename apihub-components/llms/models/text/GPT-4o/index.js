const ITextLLM = require("../../../interfaces/ITextLLM.js");

class GPT4o extends ITextLLM {
    static modelName = "gpt-4o-2024-05-13";
    constructor(config, apiKey) {
        super();
        this.config = config;
        this.apiKey = apiKey;
    }

    getModelName() {
        return GPT4o.modelName;
    }

}

module.exports = GPT4o;
