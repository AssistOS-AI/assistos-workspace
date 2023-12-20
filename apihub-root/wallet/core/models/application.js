export class Application {
    constructor(applicationData) {
        this.id = applicationData.id;
        this.installationDate = applicationData.installationDate;
        this.lastUpdate = applicationData.lastUpdate;
        this.flowsBranch = applicationData.flowsBranch;
        this.flows = [];
    }

    loadFlows(){

    }
}