export class settingsPage{
    constructor(element,invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender(){

    }
    afterRender(){
        let deleteButton=this.element.querySelector("#delete-space-button");
        if(webSkel.currentUser.id!==webSkel.currentUser.space.id){
            deleteButton.style.display="block";
        }else{
            deleteButton.style.display="none";
        }
    }
    async deleteSpace(){
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeleteSpace");
        return await webSkel.appServices.callFlow(flowId, webSkel.currentUser.space.id);
    }
}