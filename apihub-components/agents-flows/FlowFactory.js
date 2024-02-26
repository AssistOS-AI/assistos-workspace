class FlowFactory {
    constructor() {
        this.registeredFlows = {};
    }

    registerFlow(name, flowDefinition) {
        this.validateFlowCreation(name, flowDefinition);
        this.registeredFlows[name] = class extends IFlow {
            constructor(dependencies) {
                super(dependencies);
                if(flowDefinition.init) {
                    flowDefinition.init.call(this);
                }
            }
            getFlowMetadata = flowDefinition.getFlowMetadata;
            validateFlow = flowDefinition.validateFlow;
            execute = flowDefinition.execute;
        };
    }

    validateFlowCreation(name, flowDefinition) {
        if (this.registeredFlows[name]) {
            throw new Error(`Flow "${name}" already exists in the registry.`);
        }
        if (!flowDefinition.getFlowMetadata || !flowDefinition.validateFlow || !flowDefinition.execute) {
            throw new Error(`Flow "${name}" does not meet the required interface.`);
        }
    }
}
module.exports=FlowFactory