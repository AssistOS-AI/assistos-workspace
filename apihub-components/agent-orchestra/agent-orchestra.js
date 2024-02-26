class Orchestra {
    constructor(agentRef) {
        // The orchestra conductor: a reference to the main agent that will coordinate the actions.
        this.agent = agentRef;
        this.executableFlows=OrchestraService.getAllFlows();// or automatically inject them to reduce context.
        this.activeAgents = [];
        this.activeFlows = [];
    }

    executeFlow(flowName, ...params) {

    }
    validateFlow(flowName,...params){
            const result=this.executableFlows[flowName].validate(...params);
    }
    createAgent(agentConfig) {
        const newAgent = {};
        this.activeAgents.push(newAgent);
        return newAgent;
    }

}
module.exports=Orchestra
