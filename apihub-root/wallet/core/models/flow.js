export class Flow{
    constructor(flowData) {
        this.name = flowData.name;
        this.content = flowData.content;
        this.id = flowData.id || webSkel.getService("UtilsService").generateId();
        this.description = flowData.description;
        this.tags = flowData.tags || [];
    }
}