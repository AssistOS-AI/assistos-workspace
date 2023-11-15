
export class Agent{
    constructor(agentData) {
        this.personalityId = agentData.personalityId;
        this.tasks = agentData.tasks || [];
    }

    setPersonality(id){
        this.personalityId = id;
    }
    getTasks(){

    }
}