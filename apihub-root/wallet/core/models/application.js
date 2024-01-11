import {Flow} from "../../imports.js";

export class Application {
    constructor(applicationData) {
        this.id = applicationData.id;
        this.name = applicationData.name;
        this.installationDate = applicationData.installationDate;
        this.lastUpdate = applicationData.lastUpdate;
        this.flowsBranch = applicationData.flowsBranch;
        this.flows = [];
    }

    async loadFlows(){
        let flows = await storageManager.loadAppFlows(webSkel.currentUser.space.id, this.name);
        for (let [name, flowClass] of Object.entries(flows)) {
            this.flows.push(new Flow(flowClass));
        }
    }
    stringifyApplication(){
        const { flows, ...data } = this;
        return data;
    }
}