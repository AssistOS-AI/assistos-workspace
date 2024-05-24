const ITextLLM = require("../../../interfaces/ITextLLM.js");

class Gemini extends ITextLLM {
    static modelName = "gemini-pro";
    constructor(APIKey,config) {
        super(APIKey,config);
    }

    getModelName() {
        return Gemini.modelName;
    }

}

module.exports = Gemini;
