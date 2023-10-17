import {createFlowsFactory} from "../../imports.js";

export class FlowsService{
    constructor() {
        this.standardLLMApis ={
            setDefaultValues :  function (){
                this.__body = {
                    intelligence:3,
                    creativity:3,
                    cost:3,
                    variants:1
                }
            },
            setIntelligenceLevel : function ( level){
                this.__body.intelligence = level;
            },
            setCreativityLevel : async function (level){
                this.__body.creativity = level;
            },
            request : async function (prompt, max_tokens){
                this.__body.max_tokens = max_tokens;
                return await webSkel.getService("LlmsService").generateResponse(JSON.stringify(this.__body));
            },
            requestAs : async function (personalityName, prompt, numberOfOptions, max_tokens){

            },
            brainstorm : async  function (prompt, number, max_tokens){
                this.__body.prompt = prompt;
                this.__body.variants = number;
                this.__body.max_tokens = max_tokens;
                return await webSkel.getService("LlmsService").generateResponse(JSON.stringify(this.__body));
            },
            brainstormAs : async  function (personalityName,prompt, number, max_tokens){
                //this.body.personality = webSkel.space.getPersonality();
                this.__body.prompt = prompt;
                this.__body.variants = number;
                this.__body.max_tokens = max_tokens;
                return await webSkel.getService("LlmsService").generateResponse(JSON.stringify(this.__body));
            },

            setCostLevel :  function (level){
                this.__body.cost = level;
            },
            proofread : async function (personalityName, prompt){
                this.__body.prompt = prompt;
                return await webSkel.getService("LlmsService").generateResponse(JSON.stringify(this.__body));
            },
            definePersonality: function(personalityName, personalityDescription){

            },
            emotions: function(listOfPersonalities, prompt){

            },
            isLLMText: function(text){

            },
            filterLLMText: function(text){

            }
        }
        this.flows = createFlowsFactory(this.standardLLMApis);
    }

    registerFlow(name, description){
        this.flows.registerFlow(name, description);
    }

    async runFlow(...args){
        let name = args[0];
        args.shift();
        return await this.flows.callAsync(name, args);
    }
}