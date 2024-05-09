class Index {
    constructor() {
        this.name = "GPT3Point5Turbo";
        this.intelligence = 5;
        this.creativity = 5;
        this.cost = 5;
        //4,097 tokens
        this.context = 0.4;

        this.__url = "https://api.openai.com/v1/chat/completions";
        this.__body = {
            model: "gpt-3.5-turbo-1106",
            messages: [],
            temperature: 0.7,
            n: 1
        }
        let openAIMixin = require("../../../mixins/utils/openAIMixin");
        openAIMixin(this);
    }

}
module.exports = Index;
