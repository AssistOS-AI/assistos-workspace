
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
        await webSkel.getService("GlobalFlowsService").spaceFlows.deleteSpace(webSkel.currentUser.space.id);
    }
}