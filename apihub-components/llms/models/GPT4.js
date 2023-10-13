class GPT4{
    constructor() {

        this.intelligence = 9;
        this.creativity = 9;
        this.cost = 9;

        this.__url = "https://api.openai.com/v1/chat/completions";
        this.__temperature = 0.7;
        this.__messages = [];
        this.__body = {
            model: "gpt-4",
            messages: this.__messages,
            temperature: this.__temperature
        }
        let openAIMixin = require("../mixins/openAIMixin");
        openAIMixin(this);
    }

}
module.exports = GPT4;