const ITextLLM = require("../../../interfaces/ITextLLM.js");

class Gemini extends ITextLLM {
    static modelName = "gemini-pro";
    constructor(config, apiKey) {
        super();
        this.config = config;
        this.apiKey = apiKey;
    }

    getModelName() {
        return Gemini.modelName;
    }

}

module.exports = Gemini;
