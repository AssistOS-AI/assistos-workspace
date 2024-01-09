export class Flow{
    constructor(flowData) {
        this.name = flowData.name;
        this.class = flowData.class;
        this.id = flowData.id || webSkel.getService("UtilsService").generateId();
        this.description = flowData.description;
        this.parameters = flowData.parameters;
    }
}