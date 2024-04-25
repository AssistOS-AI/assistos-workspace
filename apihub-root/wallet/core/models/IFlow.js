
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
        return require("assistos-sdk").loadModule(moduleName);
    }
    callFlow(flowName, context){
        return assistOS.callFlow(flowName, context, this.personality);
    }
    callChoreography(choreographyName, context){

    }
}