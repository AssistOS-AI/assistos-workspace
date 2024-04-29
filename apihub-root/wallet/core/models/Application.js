export class Application {
    constructor(applicationData) {
        this.id = applicationData.id;
        this.name = applicationData.name;
        this.description = applicationData.description;
        this.installationDate = applicationData.installationDate;
        this.lastUpdate = applicationData.lastUpdate;
        this.flowsBranch = applicationData.flowsBranch;
        this.flows = [];
    }

    async loadFlows(){
        let flows = await assistOS.storage.loadAppFlows(assistOS.space.id, this.name);
        for (let [name, flowClass] of Object.entries(flows)) {
            this.flows.push(flowClass);
        }
    }
    stringifyApplication(){
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            installationDate: this.installationDate,
            lastUpdate: this.lastUpdate,
            flowsBranch: this.flowsBranch
        };
    }

    getFlow(flowName){
        let flow = this.flows.find(flow => flow.name === flowName);
        if(!flow){
            flow = assistOS.space.getFlow(flowName);
        }
        return flow || console.error(`Flow not found in application ${this.name} or in space, flow name: ${flowName}`);
    }
}