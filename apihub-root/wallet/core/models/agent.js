
export class Agent{
    constructor(agentData) {
        //this.personalityId = agentData.personalityId || "no id set";
        //this.tasks = agentData.tasks || [];
    }

    setPersonality(id){
        this.personalityId = id;
    }
    getTasks(){

    }

    addTask(description, date){
       this.tasks.push({description:description, date:date});
    }
}