export class Flow{
    constructor(flowClass, isNew) {
        if(!flowClass.id){
            flowClass.id = system.services.generateId();
        }
        flowClass.isNew = isNew
        this.class = flowClass;
        this.fileName = flowClass.name + "#" + flowClass.id;
    }

    stringifyClass(){
        return "export " + this.class.toString();
    }
}