export class Personality {
    constructor(personalityData) {
        this.name = personalityData.name;
        this.description = personalityData.description;
        this.id = personalityData.id || system.services.generateId();
        this.image = personalityData.image;
        this.conversationHistory = personalityData.conversationHistory || [];
        this.context = personalityData.context || [];
        this.wordCount = personalityData.wordCount || 0;
        this.capabilities = personalityData.capabilities || [];
        this.openers = personalityData.openers || [];
        this.tasks = personalityData.tasks || [];
    }
    update(personalityData){
        this.name = personalityData.name;
        this.description = personalityData.description;
        if(personalityData.image){
            this.image = personalityData.image;
        }
    }

    simplify(){
        return {
            name: this.name,
            id: this.id
        }
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
    async init(){
        let agentDefaultInstructions = "You are an agent that oversees an operating system called AssistOS. This OS has some applications installed on it. Each application has different pages and objects related to them. The bare OS also has some pages and objects related to it. You are aware of objects that are created within the OS and can perform certain operations with them or create new objects.";
        await this.addMessage("system", agentDefaultInstructions);
        let personalityPrompt = `Step into the shoes of ${this.name}, a character known for their distinctive traits: ${this.description}.From here on out respond to requests in such a way that it encapsulates the distinct essence of this character.`;
        await this.addMessage("system", personalityPrompt);
    }

    async addCapability(capability){
        this.capabilities.push(capability);
        await system.storage.storeObject(system.space.id, "personalities", this.getFileName(), JSON.stringify(this, null, 2));
    }
    async setOpeners(openers){
        this.openers = openers;
        await system.storage.storeObject(system.space.id, "personalities", this.getFileName(), JSON.stringify(this, null, 2));
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
        await system.storage.storeObject(system.space.id, "personalities", this.getFileName(), JSON.stringify(this, null, 2));
    }

    async resetConversation(){
        this.conversationHistory = [];
        this.wordCount = 0;
        this.context= [];
        this.capabilities = [];
        await system.storage.storeObject(system.space.id, "personalities", this.getFileName(), JSON.stringify(this, null, 2));
    }

    async setContext(context){
        this.context[0] = {role:"system", content: context};
        let words = context.split(" ");
        this.wordCount = words.length;
        await system.storage.storeObject(system.space.id, "personalities", this.getFileName(), JSON.stringify(this, null, 2));
    }

    getContext(){
        if(this.context.length > 0){
            return this.context;
        }else {
            return this.conversationHistory;
        }
    }
    getFileName(){
        return this.name.split(" ").join("_").toLowerCase() + "-" + this.id;
    }
}