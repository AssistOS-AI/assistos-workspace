class IFlow {
    constructor(dependencies) {
        Object.keys(dependencies).forEach(objKey=>this[objKey]=dependencies[objKey])
    }
    getFlowMetadata() {
        throw new Error("getFlowMetadata method must be implemented.");
    }

    async validateFlow() {
        throw new Error("validateFlow method must be implemented.");
    }

    async execute() {
        throw new Error("execute method must be implemented.");
    }
}
module.exports=IFlow