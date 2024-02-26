class addAnnouncementToSpace extends IFLOW{
    constructor(dependencies) {
        super(dependencies);
    }

   getFlowMetadata() {
        return {
            "description": "Add an Announcement to the SPACE the USER that send the request is currently LOGGED ON"
        }
    }
    async validateFlow() {
        try {
            this.announcementModel= this.APIS.createAnnouncementInstance(this.announcementObject)
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
module.exports= addAnnouncementToSpace