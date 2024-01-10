export class Flow{
    constructor(flowClass) {
        this.class = flowClass;
        if(!flowClass.id){
            flowClass.id = webSkel.getService("UtilsService").generateId();
        }
        this.fileName = flowClass.name + "#" + flowClass.id;
    }

    stringifyClass(){
        return "export " + this.class.toString();
    }
}