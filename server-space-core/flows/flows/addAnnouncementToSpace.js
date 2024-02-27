const IFlow = require("../IFlow.js");
class AddAnnouncementToSpace extends IFlow{
    constructor(dependencies) {
        super(dependencies);
    }

   getFlowMetadata() {
        return {
            "description": "Add an Announcement to the current SPACE of the USER who sent the request and is currently LOGGED IN"
        }
    }
    async validateFlow() {
        try {
            this.announcementModel= await this.APIS.createAnnouncementInstance(this.announcementObject)
            return true;
        }catch(error){
           this.error=error;
           return false;
        }
    }
    async execute(){
       await this.validateFlow()
            ? this.APIS.addAnnoucementToSpace(this.spaceId,this.announcementModel)
            : throw (`Error executing flow ${this.error}`);
    }
}
module.exports= AddAnnouncementToSpace