export class Flow{
    constructor(flowClass) {
        this.class = flowClass;
        this.fileName = flowClass.name;
    }

    stringifyClass(){
        return "export " + this.class.toString();
    }
}