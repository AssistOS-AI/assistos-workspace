class GPT3Point5Turbo{
    constructor() {

        this.intelligence = 5;
        this.creativity = 5;
        this.cost = 5;

        this.__url = "https://api.openai.com/v1/chat/completions";
        this.__temperature = 0.7;
        this.__messages = [];
        this.__body = {
            model: "gpt-3.5-turbo",
            messages: this.__messages,
            temperature: this.__temperature
        }
        let openAIMixin = require("../mixins/openAIMixin");
        openAIMixin(this);
    }

}
module.exports = GPT3Point5Turbo;
