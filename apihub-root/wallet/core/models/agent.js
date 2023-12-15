
export class Agent{
    constructor(agentData) {
        this.openers = agentData.openers || [];
        this.capabilities = agentData.capabilities || [];
        this.id = agentData.id||"default";
        this.name = agentData.name;
        this.tasks = [];
        this.conversationHistory = agentData.conversationHistory || [];
    }

    setPersonality(id){
        this.personalityId = id;
    }
    getTasks(){

    }

    addTask(description, date){
       this.tasks.push({description:description, date:date});
    }

    async loadFilteredKnowledge(words){
        words = words.trim();
        return await storageManager.loadFilteredKnowledge(words, this.id);
    }
    loadKnowledge() {
        const knowledge = {
            capabilities: this.capabilities,
            name: this.name,
        };
        return JSON.stringify(knowledge, null, 2);
    }
    setOpeners(openers){
        this.openers = openers;
    }
    getRandomOpener(){
        let random = Math.floor(Math.random() * this.openers.length);
        return this.openers[random];
    }
    async addMessage(role, content){
        if(!["assistant","user","system"].includes(role)){
            console.error(`LLM history: role must be either assistant, user or system. Message: ${content}`);
        }
        this.conversationHistory.push({role:role,content:content});
        await storageManager.storeObject(webSkel.currentUser.space.id, "status", "status", JSON.stringify(webSkel.currentUser.space.getSpaceStatus(),null,2));
    }

    async resetConversationHistory(){
        this.conversationHistory = [];
        await storageManager.storeObject(webSkel.currentUser.space.id, "status", "status", JSON.stringify(webSkel.currentUser.space.getSpaceStatus(),null,2));
    }
}