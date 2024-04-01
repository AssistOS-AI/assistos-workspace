
export class Agent{
    constructor(agentData) {
        this.openers = agentData.openers || [];
        this.capabilities = agentData.capabilities || [];
        this.id = agentData.id||"default";
        this.name = agentData.name;
        this.tasks = [];
        this.conversationHistory = agentData.conversationHistory || [];
        this.context = agentData.context || [];
        this.wordCount = agentData.wordCount || 0;
    }

    setPersonality(id){
        this.personalityId = id;
    }
    setCurrentTask(flowIds){
        this.flowsArray = [];
        for(let flowId of flowIds){
            this.flowsArray.push({flowId: flowId});
        }
    }

    deleteTask(){
        delete this.flowsArray;
    }

    addTask(description, date){
       this.tasks.push({description:description, date:date});
    }

    async loadFilteredKnowledge(words){
        words = words.trim();
        return await system.storage.loadFilteredKnowledge(words, this.id);
    }
    loadKnowledge() {
        const knowledge = {
            capabilities: this.capabilities,
            name: this.name,
        };
        return JSON.stringify(knowledge, null, 2);
    }

    async addCapability(capability){
        this.capabilities.push(capability);
        await system.storage.storeObject(system.space.id, "status", "status", JSON.stringify(system.space.getSpaceStatus(),null,2));
    }
    async setOpeners(openers){
        this.openers = openers;
        await system.storage.storeObject(system.space.id, "status", "status", JSON.stringify(system.space.getSpaceStatus(),null,2));
    }
    getRandomOpener(){
        let random = Math.floor(Math.random() * this.openers.length);
        return this.openers[random];
    }
    async addMessage(role, content){
        if(!["assistant","user","system"].includes(role)){
            console.error(`LLM history: role must be either assistant, user or system. Message: ${content}`);
        }
        let words = content.split(" ");
        this.wordCount += words.length;
        this.conversationHistory.push({role:role,content:content});
        await system.storage.storeObject(system.space.id, "status", "status", JSON.stringify(system.space.getSpaceStatus(),null,2));
    }

    async resetConversation(){
        this.conversationHistory = [];
        this.wordCount = 0;
        this.context= [];
        this.capabilities = [];
        await system.storage.storeObject(system.space.id, "status", "status", JSON.stringify(system.space.getSpaceStatus(),null,2));
    }

    async setContext(context){
        this.context[0] = {role:"system", content: context};
        let words = context.split(" ");
        this.wordCount = words.length;
        await system.storage.storeObject(system.space.id, "status", "status", JSON.stringify(system.space.getSpaceStatus(),null,2));
    }

    getContext(){
        if(this.context.length > 0){
            return this.context;
        }else {
            return this.conversationHistory;
        }
    }
}