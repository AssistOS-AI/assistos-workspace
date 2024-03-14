const IFlow = require("../IFlow.js");

class CreateOrchestra extends IFlow{
    constructor(dependencies) {
        super(dependencies);
    }
   getFlowMetadata (){
        return {
            "description": "Creates an Orchestra where its conductor is the referenced Agent"
        };
    };

    validateFlow  (){
        try {
            return this.APIS.createOrchestra(this.agentRef);
        } catch (error) {
            return false;
        }
    };

    async execute (){
        const result = await this.validateFlow();
        if (result) {
            return result;
        } else {
            throw new Error(`Error executing flow`);
        }
    };
}

module.exports = CreateOrchestra;
