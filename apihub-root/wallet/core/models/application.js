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
        let flows = await storageManager.loadObjects(webSkel.currentUser.space.id, this.name, "flows");
        for (let [name, flowClass] of Object.entries(flows)) {
            this.flows.push({name:name, class:flowClass, id:flowClass.id});
        }
    }
    stringifyApplication(){
        function replacer(key, value) {
            if (key === "flows") return undefined;
            else return value;
        }
        return JSON.stringify(this, replacer,2);
    }
}