class Index {
    constructor() {
        this.name = "GPT4";
        this.intelligence = 9;
        this.creativity = 9;
        this.cost = 9;
        //8,192 tokens
        this.context = 0.8;

        this.__url = "https://api.openai.com/v1/chat/completions";
        this.__body = {
            model: "gpt-4",
            messages: [],
            temperature: 0.7,
            n: 1
        }
        let openAIMixin = require("../../../mixins/utils/openAIMixin");
        openAIMixin(this);
    }

}
module.exports = Index;