export class settingsPage{
    constructor(element,invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate(async ()=>{
            this.users = JSON.parse(await webSkel.appServices.getUsersSecretsExist());
        });
    }
    beforeRender(){
        let stringHTML = "";
        for(let user of this.users){
            stringHTML += `<div class="row">
            <div class="username">${user.name}</div>
            <div class="delete-credentials" data-local-action="deleteGITCredentials ${user.id}">
                <img src="./wallet/assets/icons/trash-can.svg" alt="trash-icon">
            </div>
        </div>`;
        }
        this.tableRows = stringHTML;
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

    async deleteGITCredentials(_target, userId){
        await storageManager.storeGITCredentials(webSkel.currentUser.space.id, userId, JSON.stringify({delete: true, secretName:"username"}));
        await storageManager.storeGITCredentials(webSkel.currentUser.space.id, userId, JSON.stringify({delete: true, secretName:"token"}));
        this.invalidate(async ()=>{
            this.users = JSON.parse(await webSkel.appServices.getUsersSecretsExist());
        });
    }
}