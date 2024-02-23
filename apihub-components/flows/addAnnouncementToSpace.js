export async function addAnnouncementToSpace() {
    const getFlowMetadata = () => {
        return {
            "description": "Adds an Announcement to the SPACE the USER that send the request is currently LOGGED ON"
        }
    }

    /* Agent: Can I execute the flow? */
    const validateFlow = async () => {
        try {
            this.announcementModel= APIS.createAnnouncementInstance(this.announcementObject)
            return true;
        }catch(error){
           this.error=error;
           return false;
        }
    }
    const execute= async ()=>{
        await validateFlow()
            ? APIS.addAnnoucementToSpace(this.spaceId,this.announcementModel)
            : throw (`Error executing flow ${this.error}`);
    }

}