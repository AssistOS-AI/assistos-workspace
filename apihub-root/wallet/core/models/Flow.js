export class Flow{
    constructor(flowClass, isNew) {
        if(!flowClass.id){
            flowClass.id = assistOS.services.generateId();
        }
        flowClass.isNew = isNew
        this.class = flowClass;
        this.fileName = flowClass.name;
    }

    stringifyClass(){
        return "export " + this.class.toString();
    }
}