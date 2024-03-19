import {Flow} from "../../imports.js";

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
        let flows = await system.storage.loadAppFlows(system.space.id, this.name);
        for (let [name, flowClass] of Object.entries(flows)) {
            this.flows.push(new Flow(flowClass));
        }
    }
    stringifyApplication(){
        return {
            id: this.id,
            name:this.name,
            description: this.description,
            installationDate:this.installationDate,
            lastUpdate: this.lastUpdate,
            flowsBranch: this.flowsBranch
        };
    }
}