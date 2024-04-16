
export class IFlow{
    constructor() {

    }
    return(value){
        return this.resolve(value);
    }

    fail(error) {
        if (typeof error === "string"){
            error = new Error(error);
        }
        return this.reject(error);
    }
    loadModule(moduleName){
        switch (moduleName) {
            case "space":
                return assistOS.space;
            default:
                return assistOS[moduleName];
        }
    }
    callFlow(flowName, context){
        return assistOS.callFlow(flowName, context, this.personality);
    }
    callChoreography(choreographyName, context){

    }
}