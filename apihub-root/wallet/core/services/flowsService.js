import {createFlowsFactory} from "../../imports.js";

export class FlowsService{
    constructor() {
        this.standardLLMApis ={
            setDefaultValues :  function (){
                this.body = {
                    intelligence:3,
                    creativity:3,
                    cost:3
                }
            },
            setIntelligenceLevel : function ( level){
                this.body.intelligence = level;
            },
            setCreativityLevel : async function (level){
                this.body.creativity = level;
            },
            request : async function (prompt, max_tokens){
                this.body.max_tokens = max_tokens;
                return await webSkel.getService("LlmsService").generateResponse(JSON.stringify(this.body));
            },
            requestAs : async function (personalityName, prompt, numberOfOptions, max_tokens){

            },
            brainstorm : async  function (prompt, number, max_tokens){
                this.body.prompt = prompt;
                this.body.variants = number;
                this.body.max_tokens = max_tokens;
                return await webSkel.getService("LlmsService").generateResponse(JSON.stringify(this.body));
            },
            brainstormAs : async  function (personalityName,prompt, number, max_tokens){
                //this.body.personality = webSkel.space.getPersonality();
                this.body.prompt = prompt;
                this.body.variants = number;
                this.body.max_tokens = max_tokens;
                return await webSkel.getService("LlmsService").generateResponse(JSON.stringify(this.body));
            },

            setCostsLevel : async function (level){

            },
            proofread : async function (personalityName, prompt){

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