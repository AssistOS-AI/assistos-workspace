
export class Agent{
    constructor(agentData) {
        //this.personalityId = agentData.personalityId || "no id set";
        //this.tasks = agentData.tasks || [];
        this.id = "default";
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
}