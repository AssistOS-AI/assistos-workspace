export class Flow{
    constructor(flowClass, isNew) {
        flowClass.isNew = isNew
        this.class = flowClass;
        this.fileName = flowClass.name;
    }

    stringifyClass(){
        return "export " + this.class.toString();
    }
}