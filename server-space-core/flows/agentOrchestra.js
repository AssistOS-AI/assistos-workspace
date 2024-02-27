class Orchestra {
    constructor(agentRef) {
        // The orchestra conductor: a reference to the main agent that will coordinate the actions.
        this.agent = agentRef;
        this.agentService=require('./agentService.js');
        this.observeredAgents=[]
        this.executableFlows=agentService.getFlows();
    }

    /* use flows or other APIS to hide the observing logic */

    addObserver(observer) {
        this.observeredAgents.push(observer);
    }

    removeObserver(observer) {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observeredAgents.splice(index, 1);
        }
    }

    notifyObservers(event, data) {
        this.observeredAgents.forEach(observer => observer.update(event, data));
    }

    executeFlow(flowName, ...params) {
        /* ....... */
        this.notifyObservers('flowCompleted', { flowName, params });
    }
    validateFlow(flowName,...params){
            return this.executableFlows[flowName].validate(...params);
    }
    createAgent(agentConfig) {
        /* APIS.createAgent */
        const newAgent = new Agent(agentConfigs)
        this.addObserver(newAgent)
    }

}
module.exports=Orchestra
