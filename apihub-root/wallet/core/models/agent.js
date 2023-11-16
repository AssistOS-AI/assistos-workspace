
export class Agent{
    constructor(agentData) {
        this.agentConfigs=agentData.agentConfigs;
        this.agentIntent=agentData.agentIntent;
        this.userIntents=agentData.userIntents;
        this.id = agentData.id||"default";
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
            agentConfigs: this.agentConfigs,
            agentIntent: this.agentIntent,
            userIntents: this.userIntents
        };
        return JSON.stringify(knowledge, null, 2);
    }
}