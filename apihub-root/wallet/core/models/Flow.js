export class Flow{
    constructor(flowClass) {
        if(!flowClass.id){
            flowClass.id = webSkel.appServices.generateId();
        }
        this.class = flowClass;
        this.fileName = flowClass.name + "#" + flowClass.id;
    }

    stringifyClass(){
        return "export " + this.class.toString();
    }
}